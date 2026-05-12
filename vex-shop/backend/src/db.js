const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false, // Importante para Aiven
    // Aiven maneja los certificados oooautomáticamente
  } : false,
});

// Verificar conexión
pool.on('connect', () => {
  console.log('Conectado a la base de datos');
});

pool.on('error', (err) => {
  console.error('Error en la conexión a la base de datos:', err);
});

module.exports = pool;