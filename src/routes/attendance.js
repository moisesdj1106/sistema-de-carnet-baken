const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Registrar entrada o salida por QR o código manual
router.post('/scan', async (req, res) => {
  const { card_code } = req.body;
  if (!card_code) return res.status(400).json({ error: 'Código requerido' });
  try {
    const { rows: cards } = await pool.query(
      `SELECT c.*, w.full_name, w.photo_url, p.name as position_name
       FROM id_cards c
       JOIN workers w ON c.worker_id = w.id
       LEFT JOIN positions p ON w.position_id = p.id
       WHERE c.card_code=$1 AND c.is_active=true`,
      [card_code]
    );
    if (!cards.length) return res.status(404).json({ error: 'Carnet no válido o inactivo' });
    const card = cards[0];

    // Anti-duplicados: ignorar si el último registro tiene menos de 30 segundos
    const { rows: recent } = await pool.query(
      `SELECT * FROM attendance_logs
       WHERE worker_id=$1 AND logged_at > NOW() - INTERVAL '30 seconds'
       ORDER BY logged_at DESC LIMIT 1`,
      [card.worker_id]
    );
    if (recent.length) {
      return res.status(429).json({
        error: 'Registro reciente detectado, espera unos segundos',
        event_type: recent[0].event_type,
      });
    }

    // Determinar entrada o salida según el último registro del día
    const today = new Date().toISOString().split('T')[0];
    const { rows: lastLog } = await pool.query(
      `SELECT * FROM attendance_logs
       WHERE worker_id=$1 AND DATE(logged_at AT TIME ZONE 'America/Caracas')=$2
       ORDER BY logged_at DESC LIMIT 1`,
      [card.worker_id, today]
    );

    const event_type = (!lastLog.length || lastLog[0].event_type === 'exit') ? 'entry' : 'exit';

    const { rows: log } = await pool.query(
      `INSERT INTO attendance_logs (worker_id, card_id, event_type) VALUES ($1,$2,$3) RETURNING *`,
      [card.worker_id, card.id, event_type]
    );

    res.json({
      success: true,
      event_type,
      worker: { full_name: card.full_name, photo_url: card.photo_url, position_name: card.position_name },
      logged_at: log[0].logged_at,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar registro individual (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM attendance_logs WHERE id=$1', [req.params.id]);
    res.json({ message: 'Registro eliminado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Listado de asistencia del día (admin)
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { rows } = await pool.query(`
      SELECT al.*, w.full_name, w.photo_url, p.name as position_name
      FROM attendance_logs al
      JOIN workers w ON al.worker_id = w.id
      LEFT JOIN positions p ON w.position_id = p.id
      WHERE DATE(al.logged_at) = $1
      ORDER BY al.logged_at DESC
    `, [today]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reporte quincenal por trabajador
router.get('/biweekly', auth, async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'Parámetros start y end requeridos' });
  try {
    // Obtener todos los trabajadores
    const { rows: workers } = await pool.query(`
      SELECT w.id, w.full_name, w.cedula, p.name as position_name
      FROM workers w LEFT JOIN positions p ON w.position_id = p.id
    `);

    const results = [];
    for (const worker of workers) {
      const { rows: logs } = await pool.query(`
        SELECT * FROM attendance_logs
        WHERE worker_id=$1 AND DATE(logged_at) BETWEEN $2 AND $3
        ORDER BY logged_at ASC
      `, [worker.id, start, end]);

      // Calcular días trabajados, horas y faltas
      const dayMap = {};
      for (const log of logs) {
        const day = new Date(log.logged_at).toISOString().split('T')[0];
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(log);
      }

      let totalMinutes = 0;
      const workedDays = Object.keys(dayMap);
      for (const day of workedDays) {
        const dayLogs = dayMap[day];
        const entries = dayLogs.filter(l => l.event_type === 'entry');
        const exits = dayLogs.filter(l => l.event_type === 'exit');
        for (let i = 0; i < Math.min(entries.length, exits.length); i++) {
          const diff = new Date(exits[i].logged_at) - new Date(entries[i].logged_at);
          totalMinutes += Math.floor(diff / 60000);
        }
      }

      // Calcular días hábiles en el rango
      const startDate = new Date(start);
      const endDate = new Date(end);
      let businessDays = 0;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) businessDays++;
      }

      const absences = businessDays - workedDays.length;
      results.push({
        ...worker,
        worked_days: workedDays.length,
        absent_days: absences < 0 ? 0 : absences,
        total_hours: Math.floor(totalMinutes / 60),
        total_minutes: totalMinutes % 60,
        business_days: businessDays,
        daily_detail: dayMap,
      });
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
