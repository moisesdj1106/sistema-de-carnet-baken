const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Login de administrador
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const admin = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, is_admin: true },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        is_admin: true
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar estado de configuración (si hay al menos un admin)
router.get('/setup-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM admins');
    const hasAdmins = parseInt(result.rows[0].count) > 0;
    res.json({ hasAdmins });
  } catch (error) {
    console.error('Error en setup-status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar nuevo administrador (requiere autenticación de admin)
router.post('/register', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, passwordHash]
    );

    res.status(201).json({
      message: 'Administrador creado exitosamente',
      admin: result.rows[0]
    });
  } catch (error) {
    console.error('Error en registro de admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar primer administrador (sin autenticación)
router.post('/register-first', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si ya hay administradores
    const countResult = await pool.query('SELECT COUNT(*) as count FROM admins');
    const hasAdmins = parseInt(countResult.rows[0].count) > 0;

    if (hasAdmins) {
      return res.status(403).json({ error: 'Ya existe un administrador. Use la ruta /register con autenticación' });
    }

    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, passwordHash]
    );

    res.status(201).json({
      message: 'Primer administrador creado exitosamente',
      admin: result.rows[0]
    });
  } catch (error) {
    console.error('Error en registro del primer admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los administradores
router.get('/admins', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, created_at FROM admins ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener administradores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar administrador
router.delete('/admins/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = parseInt(id);

    if (isNaN(adminId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // No permitir eliminar al último administrador
    const countResult = await pool.query('SELECT COUNT(*) as count FROM admins');
    const adminCount = parseInt(countResult.rows[0].count);

    if (adminCount <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el último administrador' });
    }

    const result = await pool.query(
      'DELETE FROM admins WHERE id = $1 RETURNING id',
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    res.json({ message: 'Administrador eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar administrador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;