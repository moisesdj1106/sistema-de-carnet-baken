const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configuración de multer para subida de imágenes (en memoria para almacenar en DB)
const storage = multer.memoryStorage(); // Almacena en memoria para convertir a bytea

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

// Obtener todos los trabajadores (sin datos binarios de foto)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.id, w.full_name, w.cedula, w.position_id, w.email, w.phone, w.photo_url, w.created_at, p.name as position_name 
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

// Obtener foto de trabajador
router.get('/:id/photo', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT photo_data FROM workers WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0 || !result.rows[0].photo_data) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }
    
    // Obtener el tipo MIME de la imagen (asumimos JPEG por defecto)
    const photoData = result.rows[0].photo_data;
    
    // Configurar headers para imagen
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
    
    // Enviar datos binarios
    res.send(photoData);
  } catch (error) {
    console.error('Error al obtener foto:', error);
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
    let photo_data = null;
    
    if (req.file) {
      // Convertir buffer a bytea para PostgreSQL
      photo_data = req.file.buffer;
      // También mantener photo_url por compatibilidad (opcional)
      photo_url = `/api/workers/${req.file.originalname}/photo`; // Ruta para obtener la foto
    }

    const result = await pool.query(
      `INSERT INTO workers (full_name, cedula, position_id, email, phone, photo_url, photo_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, full_name, cedula, position_id, email, phone, photo_url, created_at`,
      [full_name, cedula, position_id || null, email || null, phone || null, photo_url, photo_data]
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
    let photo_data = existingWorker.rows[0].photo_data;
    
    // Si se sube una nueva foto
    if (req.file) {
      // Actualizar photo_data con el nuevo buffer
      photo_data = req.file.buffer;
      // Actualizar photo_url por compatibilidad
      photo_url = `/api/workers/${req.file.originalname}/photo`;
    }
    
    // Si se solicita eliminar la foto (remove_photo = true en el body)
    if (req.body.remove_photo === 'true' || req.body.remove_photo === true) {
      // Eliminar foto de la base de datos
      photo_data = null;
      photo_url = null;
    }

    const result = await pool.query(
      `UPDATE workers 
       SET full_name = $1, cedula = $2, position_id = $3, email = $4, phone = $5, photo_url = $6, photo_data = $7
       WHERE id = $8 
       RETURNING id, full_name, cedula, position_id, email, phone, photo_url, created_at`,
      [full_name, cedula, position_id || null, email || null, phone || null, photo_url, photo_data, id]
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

// Eliminar trabajador
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el trabajador existe
    const existingWorker = await pool.query(
      'SELECT id FROM workers WHERE id = $1',
      [id]
    );

    if (existingWorker.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
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


// Ruta para eliminar foto de trabajador - añadido para forzar despliegue