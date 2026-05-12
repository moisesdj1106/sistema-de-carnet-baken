const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'worker-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
  }
});

// Obtener todos los trabajadores
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, p.name as position_name 
      FROM workers w 
      LEFT JOIN positions p ON w.position_id = p.id 
      ORDER BY w.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener trabajadores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los puestos
router.get('/positions/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM positions ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener puestos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo trabajador
router.post('/', authMiddleware, adminMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const { full_name, cedula, position_id, email, phone } = req.body;
    
    if (!full_name || !cedula) {
      return res.status(400).json({ error: 'Nombre completo y cédula son requeridos' });
    }

    // Verificar si la cédula ya existe
    const existingWorker = await pool.query(
      'SELECT id FROM workers WHERE cedula = $1',
      [cedula]
    );

    if (existingWorker.rows.length > 0) {
      return res.status(400).json({ error: 'La cédula ya está registrada' });
    }

    let photo_url = null;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO workers (full_name, cedula, position_id, email, phone, photo_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [full_name, cedula, position_id || null, email || null, phone || null, photo_url]
    );

    res.status(201).json({
      message: 'Trabajador creado exitosamente',
      worker: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear trabajador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar trabajador
router.put('/:id', authMiddleware, adminMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, cedula, position_id, email, phone } = req.body;
    
    if (!full_name || !cedula) {
      return res.status(400).json({ error: 'Nombre completo y cédula son requeridos' });
    }

    // Verificar si el trabajador existe
    const existingWorker = await pool.query(
      'SELECT id, photo_url FROM workers WHERE id = $1',
      [id]
    );

    if (existingWorker.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    // Verificar si la cédula ya existe en otro trabajador
    const duplicateCedula = await pool.query(
      'SELECT id FROM workers WHERE cedula = $1 AND id != $2',
      [cedula, id]
    );

    if (duplicateCedula.rows.length > 0) {
      return res.status(400).json({ error: 'La cédula ya está registrada en otro trabajador' });
    }

    let photo_url = existingWorker.rows[0].photo_url;
    
    // Si se sube una nueva foto, eliminar la anterior si existe
    if (req.file) {
      // Eliminar foto anterior si existe
      if (photo_url) {
        const oldPhotoPath = path.join(__dirname, '..', '..', photo_url);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      photo_url = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE workers 
       SET full_name = $1, cedula = $2, position_id = $3, email = $4, phone = $5, photo_url = $6 
       WHERE id = $7 
       RETURNING *`,
      [full_name, cedula, position_id || null, email || null, phone || null, photo_url, id]
    );

    res.json({
      message: 'Trabajador actualizado exitosamente',
      worker: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar trabajador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar foto de trabajador
router.delete('/:id/photo', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el trabajador existe y obtener su foto
    const existingWorker = await pool.query(
      'SELECT id, photo_url FROM workers WHERE id = $1',
      [id]
    );

    if (existingWorker.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    // Eliminar foto si existe
    const photo_url = existingWorker.rows[0].photo_url;
    if (photo_url) {
      const photoPath = path.join(__dirname, '..', '..', photo_url);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Actualizar trabajador para eliminar la referencia a la foto
    await pool.query(
      'UPDATE workers SET photo_url = NULL WHERE id = $1',
      [id]
    );

    res.json({ message: 'Foto eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar foto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar trabajador
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el trabajador existe y obtener su foto
    const existingWorker = await pool.query(
      'SELECT id, photo_url FROM workers WHERE id = $1',
      [id]
    );

    if (existingWorker.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    // Eliminar foto si existe
    const photo_url = existingWorker.rows[0].photo_url;
    if (photo_url) {
      const photoPath = path.join(__dirname, '..', '..', photo_url);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Eliminar trabajador (las tarjetas y registros de asistencia se eliminarán en cascada)
    await pool.query('DELETE FROM workers WHERE id = $1', [id]);

    res.json({ message: 'Trabajador eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar trabajador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;