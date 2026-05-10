const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Listar trabajadores
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT w.*, p.name as position_name
      FROM workers w
      LEFT JOIN positions p ON w.position_id = p.id
      ORDER BY w.full_name
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear trabajador
router.post('/', auth, upload.single('photo'), async (req, res) => {
  const { full_name, cedula, position_id, email, phone } = req.body;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO workers (full_name, cedula, position_id, email, phone, photo_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [full_name, cedula, position_id, email, phone, photo_url]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Actualizar trabajador
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  const { full_name, cedula, position_id, email, phone } = req.body;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    const fields = [full_name, cedula, position_id, email, phone];
    let query = `UPDATE workers SET full_name=$1, cedula=$2, position_id=$3, email=$4, phone=$5`;
    if (photo_url) { query += `, photo_url=$6 WHERE id=$7`; fields.push(photo_url, req.params.id); }
    else { query += ` WHERE id=$6`; fields.push(req.params.id); }
    query += ' RETURNING *';
    const { rows } = await pool.query(query, fields);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar trabajador
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM workers WHERE id=$1', [req.params.id]);
    res.json({ message: 'Eliminado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Listar puestos
router.get('/positions/all', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM positions ORDER BY name');
  res.json(rows);
});

module.exports = router;
