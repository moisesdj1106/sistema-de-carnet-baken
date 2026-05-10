const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM admins WHERE username=$1', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: rows[0].id, username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Verificar si ya existe algún admin (para el setup inicial)
router.get('/setup-status', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM admins');
    res.json({ hasAdmins: parseInt(rows[0].count) > 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Registro público — solo permitido si no hay ningún admin aún (primer setup)
// Si ya hay admins, requiere autenticación
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  try {
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM admins');
    const hasAdmins = parseInt(countRows[0].count) > 0;

    // Si ya hay admins, verificar token
    if (hasAdmins) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Se requiere autenticación para registrar nuevos admins' });
      try {
        jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Token inválido' });
      }
    }

    const exists = await pool.query('SELECT id FROM admins WHERE username=$1', [username]);
    if (exists.rows.length) return res.status(409).json({ error: 'El usuario ya existe' });

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1,$2) RETURNING id, username, created_at',
      [username, password_hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Listar admins (requiere auth)
router.get('/admins', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, username, created_at FROM admins ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar admin (no puede eliminarse a sí mismo)
router.delete('/admins/:id', auth, async (req, res) => {
  if (parseInt(req.params.id) === req.admin.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  try {
    await pool.query('DELETE FROM admins WHERE id=$1', [req.params.id]);
    res.json({ message: 'Admin eliminado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
