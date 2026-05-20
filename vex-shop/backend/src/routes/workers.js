const express = require('express');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configurar multer para manejar archivos
const upload = multer({
  storage: multer.diskStorage({
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
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB límite
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Obtener todos los trabajadores (TEMPORAL: sin autenticación para pruebas)
router.get('/', async (req, res) => {
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
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

// Crear un nuevo trabajador (TEMPORAL: sin autenticación para pruebas)
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { full_name, cedula, position_id, email, phone } = req.body;
    let photo_data = null;

    if (!full_name || !cedula) {
      return res.status(400).json({ error: 'Nombre completo y cédula son requeridos' });
    }

    // Si se subió una foto, leerla como base64
    if (req.file) {
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      photo_data = fileBuffer.toString('base64');
      
      // Opcional: eliminar el archivo temporal después de convertirlo a base64
      fs.unlinkSync(filePath);
    }

    const result = await pool.query(`
      INSERT INTO workers (full_name, cedula, position_id, email, phone, photo_data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [full_name, cedula, position_id, email, phone, photo_data]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear trabajador:', error);
    res.status(500).json({ error: 'Error al crear trabajador' });
  }
});

// Actualizar un trabajador (TEMPORAL: sin autenticación para pruebas)
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, cedula, position_id, email, phone, remove_photo } = req.body;
    let photo_data = null;

    // Si se subió una nueva foto, leerla como base64
    if (req.file) {
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      photo_data = fileBuffer.toString('base64');
      fs.unlinkSync(filePath);
    } else if (remove_photo === 'true') {
      // Si se solicita eliminar la foto, establecer photo_data como null
      photo_data = null;
    } else {
      // Si no hay nueva foto y no se solicita eliminar, mantener la existente
      const currentResult = await pool.query('SELECT photo_data FROM workers WHERE id = $1', [id]);
      if (currentResult.rows.length > 0) {
        photo_data = currentResult.rows[0].photo_data;
      }
    }

    const result = await pool.query(`
      UPDATE workers
      SET full_name = $1, cedula = $2, position_id = $3, email = $4, phone = $5, photo_data = $6
      WHERE id = $7
      RETURNING *
    `, [full_name, cedula, position_id, email, phone, photo_data, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar trabajador:', error);
    res.status(500).json({ error: 'Error al actualizar trabajador' });
  }
});

// Eliminar un trabajador (TEMPORAL: sin autenticación para pruebas)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM workers
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    res.json({ message: 'Trabajador eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar trabajador:', error);
    res.status(500).json({ error: 'Error al eliminar trabajador' });
  }
});

// Obtener la foto de un trabajador (TEMPORAL: sin autenticación para pruebas)
router.get('/:id/photo', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT photo_data FROM workers WHERE id = $1`, [id]);

    if (result.rows.length === 0 || !result.rows[0].photo_data) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(result.rows[0].photo_data);
  } catch (error) {
    console.error('Error al obtener foto:', error);
    res.status(500).json({ error: 'Error al obtener foto' });
  }
});

module.exports = router;