const express = require('express');
const QRCode = require('qrcode');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Obtener todas las tarjetas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, w.full_name, w.cedula, w.photo_data, p.name as position_name 
      FROM id_cards c 
      JOIN workers w ON c.worker_id = w.id 
      LEFT JOIN positions p ON w.position_id = p.id 
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tarjetas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una tarjeta específica
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT c.*, w.full_name, w.cedula, w.email, w.phone, w.photo_data, p.name as position_name 
      FROM id_cards c 
      JOIN workers w ON c.worker_id = w.id 
      LEFT JOIN positions p ON w.position_id = p.id 
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener tarjeta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva tarjeta
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { worker_id } = req.body;

    if (!worker_id) {
      return res.status(400).json({ error: 'ID del trabajador es requerido' });
    }

    // Verificar si el trabajador existe
    const workerResult = await pool.query(
      'SELECT id, full_name, cedula FROM workers WHERE id = $1',
      [worker_id]
    );

    if (workerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const worker = workerResult.rows[0];

    // Verificar si el trabajador ya tiene una tarjeta activa
    const existingCard = await pool.query(
      'SELECT id FROM id_cards WHERE worker_id = $1 AND is_active = true',
      [worker_id]
    );

    if (existingCard.rows.length > 0) {
      return res.status(400).json({ error: 'El trabajador ya tiene una tarjeta activa' });
    }

    // Generar código único de 6 caracteres alfanuméricos
    const generateShortCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Generar código único y verificar que no exista
    let card_code;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      card_code = generateShortCode();
      const existingCode = await pool.query(
        'SELECT id FROM id_cards WHERE card_code = $1',
        [card_code]
      );
      if (existingCode.rows.length === 0) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'No se pudo generar un código único' });
    }

    // Generar QR con información del trabajador
    const qrData = JSON.stringify({
      card_code: card_code,
      worker_id: worker.id,
      worker_name: worker.full_name,
      cedula: worker.cedula,
      timestamp: new Date().toISOString()
    });

    const qrDataUrl = await QRCode.toDataURL(qrData);

    const result = await pool.query(
      `INSERT INTO id_cards (worker_id, card_code, qr_data) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [worker_id, card_code, qrDataUrl]
    );

    res.status(201).json({
      message: 'Tarjeta creada exitosamente',
      card: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear tarjeta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Activar/desactivar tarjeta
router.patch('/:id/toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE id_cards 
       SET is_active = NOT is_active 
       WHERE id = $1 
       RETURNING id, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    const status = result.rows[0].is_active ? 'activada' : 'desactivada';
    res.json({
      message: `Tarjeta ${status} exitosamente`,
      is_active: result.rows[0].is_active
    });
  } catch (error) {
    console.error('Error al cambiar estado de tarjeta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar tarjeta
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM id_cards WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    res.json({ message: 'Tarjeta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tarjeta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;