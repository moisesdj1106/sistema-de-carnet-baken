const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Listar carnets
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, w.full_name, w.cedula, w.photo_url, p.name as position_name
      FROM id_cards c
      JOIN workers w ON c.worker_id = w.id
      LEFT JOIN positions p ON w.position_id = p.id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear carnet para un trabajador
router.post('/', auth, async (req, res) => {
  const { worker_id } = req.body;
  try {
    const card_code = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
    const qr_data = JSON.stringify({ card_code, worker_id });
    const qr_image = await QRCode.toDataURL(qr_data);
    const { rows } = await pool.query(
      `INSERT INTO id_cards (worker_id, card_code, qr_data) VALUES ($1,$2,$3) RETURNING *`,
      [worker_id, card_code, qr_image]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener carnet con datos del trabajador para PDF
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, w.full_name, w.cedula, w.photo_url, p.name as position_name
      FROM id_cards c
      JOIN workers w ON c.worker_id = w.id
      LEFT JOIN positions p ON w.position_id = p.id
      WHERE c.id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar carnet
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM id_cards WHERE id=$1', [req.params.id]);
    res.json({ message: 'Carnet eliminado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Activar/desactivar carnet
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE id_cards SET is_active = NOT is_active WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
