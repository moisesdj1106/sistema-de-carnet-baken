const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configuración de multer para subida de imágenes (en memoria)
const storage = multer.memoryStorage();

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
      SELECT w.id, w.full_name, w.cedula, w.position_id, w.email, w.phone, w.created_at, p.name as position_name 
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
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }
    
    const worker = result.rows[0];
    
    // Si hay photo_data
    if (worker.photo_data) {
      // Convertir de base64 a buffer
      const buffer = Buffer.from(worker.photo_data, 'base64');
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    }
    
    // Si no hay foto
    return res.status(404).json({ error: 'Foto no encontrada' });
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
    
    // 1. Validación de campos obligatorios
    if (!full_name || !cedula) {
      return res.status(400).json({ 
        error: 'Datos incompletos', 
        details: 'El nombre completo y la cédula son obligatorios.' 
      });
    }

    // 2. Validación de Cédula Duplicada (Doble verificación por seguridad)
    try {
      const existingWorker = await pool.query(
        'SELECT id FROM workers WHERE cedula = $1',
        [cedula]
      );

      if (existingWorker.rows.length > 0) {
        return res.status(400).json({ error: 'La cédula ya está registrada en el sistema.' });
      }
    } catch (dbError) {
      throw new Error('Error al verificar duplicados: ' + dbError.message);
    }

    // 3. Procesamiento de imagen
    let photo_data = null;
    if (req.file) {
      // Nota: Si la imagen es muy grande, guardarla en Base64 en Postgres puede ser lento.
      // Considera que el campo photo_data debe ser tipo TEXT en tu DB.
      photo_data = req.file.buffer.toString('base64');
    }

    // 4. Inserción con manejo de errores de BD específicos
    const query = `
      INSERT INTO workers (full_name, cedula, position_id, email, phone, photo_data) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, full_name, cedula, position_id, email, phone, created_at
    `;
    const values = [full_name, cedula, position_id || null, email || null, phone || null, photo_data];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Trabajador creado exitosamente',
      worker: result.rows[0]
    });

  } catch (error) {
    // REGISTRO EN CONSOLA (Para ti en Render Logs)
    console.error('--- ERROR DETECTADO ---');
    console.error('Mensaje:', error.message);
    console.error('Código Error:', error.code); // Útil para errores de PostgreSQL (ej. 23503)
    console.error('Stack:', error.stack);

    // RESPUESTA AL CLIENTE
    // Si el error viene de Postgres (ejemplo: position_id no existe)
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Error de referencia', 
        details: 'El cargo (position_id) seleccionado no existe.' 
      });
    }

    // Error por datos demasiado largos
    if (error.code === '22001') {
      return res.status(400).json({ 
        error: 'Dato demasiado largo', 
        details: 'Uno de los campos excede el límite de caracteres (posiblemente la foto o el nombre).' 
      });
    }

    // Error genérico controlado
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: error.message,
      code: error.code 
    });
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
      'SELECT id, photo_data FROM workers WHERE id = $1',
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

    let photo_data = existingWorker.rows[0].photo_data;
    
    // Si se sube una nueva foto
    if (req.file) {
      // Convertir buffer a base64
      photo_data = req.file.buffer.toString('base64');
    }
    
    // Si se solicita eliminar la foto
    if (req.body.remove_photo === 'true' || req.body.remove_photo === true) {
      photo_data = null;
    }

    const result = await pool.query(
      `UPDATE workers 
       SET full_name = $1, cedula = $2, position_id = $3, email = $4, phone = $5, photo_data = $6
       WHERE id = $7
       RETURNING id, full_name, cedula, position_id, email, phone, created_at`,
      [full_name, cedula, position_id || null, email || null, phone || null, photo_data, id]
    );

    res.json({
      message: 'Trabajador actualizado exitosamente',
      worker: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar trabajador:', error);
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
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

    // Eliminar trabajador
    await pool.query('DELETE FROM workers WHERE id = $1', [id]);

    res.json({ message: 'Trabajador eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar trabajador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;