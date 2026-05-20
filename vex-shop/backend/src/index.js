require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();

// Configuración de CORS para producción
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://horarioempresarial.netlify.app',
  'http://localhost:3000', // Frontend en puerto 3000
  'http://localhost:5173'  // Para compatibilidad
].filter(Boolean); // Elimina valores undefined

console.log('Orígenes permitidos:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origen (como las realizadas desde herramientas como curl o Invoke-RestMethod)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('Origen bloqueado por CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Crear directorio de uploads si no existe
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Directorio de uploads creado: ${uploadDir}`);
}

// Servir archivos estáticos - IMPORTANTE: usar path absoluto
const absoluteUploadPath = path.resolve(__dirname, '..', uploadDir);
app.use('/uploads', express.static(absoluteUploadPath, {
  setHeaders: (res, path) => {
    // Permitir CORS para imágenes
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'VEX Shop API'
  });
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de VEX Shop',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      workers: '/api/workers',
      cards: '/api/cards',
      attendance: '/api/attendance'
    },
    documentation: 'Consulta el README para más información'
  });
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/attendance', require('./routes/attendance'));

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`VEX Shop API corriendo en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'No configurado'}`);
  console.log(`Upload directory: ${uploadDir}`);
  console.log(`=================================`);
});