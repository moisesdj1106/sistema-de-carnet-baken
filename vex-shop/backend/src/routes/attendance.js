const express = require('express');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Escanear tarjeta para registro de asistencia
router.post('/scan', async (req, res) => {
  try {
    console.log('📱 Recibiendo solicitud de escaneo');
    const { card_code } = req.body;

    if (!card_code) {
      return res.status(400).json({ error: 'Código de tarjeta es requerido' });
    }

    console.log('🔍 Buscando tarjeta con código:', card_code);
    
    // Buscar la tarjeta
    const cardResult = await pool.query(`
      SELECT c.*, w.full_name, w.cedula, p.name as position_name, w.photo_url
      FROM id_cards c 
      JOIN workers w ON c.worker_id = w.id 
      LEFT JOIN positions p ON w.position_id = p.id 
      WHERE c.card_code = $1 AND c.is_active = true
    `, [card_code]);

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada o inactiva' });
    }

    const card = cardResult.rows[0];
    const worker_id = card.worker_id;
    const card_id = card.id;

    // Obtener TODOS los registros de asistencia del trabajador hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendanceResult = await pool.query(`
      SELECT id, event_type, logged_at
      FROM attendance_logs 
      WHERE worker_id = $1 
        AND logged_at >= $2 
        AND logged_at < $3 
      ORDER BY logged_at DESC
    `, [worker_id, today, tomorrow]);

    const todayAttendance = todayAttendanceResult.rows;
    
    // Determinar el próximo tipo de evento
    let event_type = 'entry';
    let message = 'Entrada registrada';
    
    if (todayAttendance.length > 0) {
      const lastAttendance = todayAttendance[0];
      const lastTime = new Date(lastAttendance.logged_at);
      const now = new Date();
      const diffSeconds = (now - lastTime) / 1000;
      
      // Si el último evento fue hace menos de 30 segundos, rechazar
      if (diffSeconds < 30) {
        return res.status(400).json({ 
          error: `Espere ${Math.ceil(30 - diffSeconds)} segundos antes de escanear nuevamente` 
        });
      }
      
      // Si el último evento fue una ENTRADA, el próximo debe ser SALIDA
      // Si el último evento fue una SALIDA, el próximo debe ser ENTRADA
      if (lastAttendance.event_type === 'entry') {
        event_type = 'exit';
        message = 'Salida registrada';
        
        // Verificar que haya pasado al menos 1 minuto desde la entrada
        if (diffSeconds < 60) {
          return res.status(400).json({ 
            error: `Debe esperar al menos 1 minuto entre entrada y salida. Tiempo transcurrido: ${Math.floor(diffSeconds)} segundos` 
          });
        }
      } else {
        event_type = 'entry';
        message = 'Entrada registrada';
      }
    }

    // Registrar la asistencia
    const attendanceResult = await pool.query(
      `INSERT INTO attendance_logs (worker_id, card_id, event_type) 
       VALUES ($1, $2, $3) 
       RETURNING id, event_type, logged_at`,
      [worker_id, card_id, event_type]
    );

    const attendance = attendanceResult.rows[0];

    res.json({
      success: true,
      message: message,
      event_type: attendance.event_type, // Para compatibilidad con frontend existente
      logged_at: attendance.logged_at,   // Para compatibilidad con frontend existente
      attendance: {
        id: attendance.id,
        event_type: attendance.event_type,
        logged_at: attendance.logged_at,
        event_name: event_type === 'entry' ? 'Entrada' : 'Salida'
      },
      worker: {
        id: card.worker_id,
        full_name: card.full_name,
        cedula: card.cedula,
        position_name: card.position_name,
        photo_url: card.photo_url
      }
    });
  } catch (error) {
    console.error('Error al escanear tarjeta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener registros de asistencia de hoy
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await pool.query(`
      SELECT a.*, w.full_name, w.cedula, w.photo_url, p.name as position_name, c.card_code 
      FROM attendance_logs a 
      JOIN workers w ON a.worker_id = w.id 
      LEFT JOIN positions p ON w.position_id = p.id 
      LEFT JOIN id_cards c ON a.card_id = c.id 
      WHERE a.logged_at >= $1 AND a.logged_at < $2 
      ORDER BY a.logged_at DESC
    `, [today, tomorrow]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener asistencia de hoy:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener reporte quincenal
router.get('/biweekly', authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Obtener todos los registros en el rango de fechas
    const attendanceResult = await pool.query(`
      SELECT a.*, w.full_name, w.cedula, p.name as position_name 
      FROM attendance_logs a 
      JOIN workers w ON a.worker_id = w.id 
      LEFT JOIN positions p ON w.position_id = p.id 
      WHERE a.logged_at >= $1 AND a.logged_at <= $2 
      ORDER BY a.logged_at
    `, [startDate, endDate]);

    // Obtener todos los trabajadores activos
    const workersResult = await pool.query(`
      SELECT w.id, w.full_name, w.cedula, p.name as position_name 
      FROM workers w 
      LEFT JOIN positions p ON w.position_id = p.id 
      ORDER BY w.full_name
    `);

    const workers = workersResult.rows;
    const attendance = attendanceResult.rows;

    // Organizar datos por trabajador y día
    const report = workers.map(worker => {
      const workerAttendance = attendance.filter(a => a.worker_id === worker.id);
      
      // Agrupar por día
      const daysMap = new Map();
      
      workerAttendance.forEach(record => {
        const dateKey = new Date(record.logged_at).toISOString().split('T')[0];
        
        if (!daysMap.has(dateKey)) {
          daysMap.set(dateKey, {
            date: dateKey,
            entries: [],
            exits: []
          });
        }
        
        const day = daysMap.get(dateKey);
        if (record.event_type === 'entry') {
          day.entries.push(record.logged_at);
        } else {
          day.exits.push(record.logged_at);
        }
      });
      
      const days = Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      
      // Calcular total de horas trabajadas
      let totalHours = 0;
      days.forEach(day => {
        if (day.entries.length > 0 && day.exits.length > 0) {
          // Ordenar entradas y salidas por tiempo
          day.entries.sort();
          day.exits.sort();
          
          // Calcular horas trabajadas (tomar el primer par entrada-salida)
          const entryTime = new Date(day.entries[0]);
          const exitTime = new Date(day.exits[0]);
          const hoursWorked = (exitTime - entryTime) / (1000 * 60 * 60);
          
          if (hoursWorked > 0) {
            totalHours += hoursWorked;
          }
        }
      });
      
      return {
        worker: {
          id: worker.id,
          full_name: worker.full_name,
          cedula: worker.cedula,
          position_name: worker.position_name
        },
        days,
        total_days: days.length,
        total_hours: parseFloat(totalHours.toFixed(2))
      };
    });

    res.json({
      start_date: start,
      end_date: end,
      report
    });
  } catch (error) {
    console.error('Error al obtener reporte quincenal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar registro de asistencia
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM attendance_logs WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
    }

    res.json({ message: 'Registro de asistencia eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de asistencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;