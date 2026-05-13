#!/usr/bin/env node

/**
 * Script para migrar a almacenamiento de fotos en base de datos (bytea)
 * Uso: node scripts/migrate-photo-data.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vex_shop',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

console.log('Migrando a almacenamiento de fotos en base de datos...');
console.log('Configuración:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user
});

// SQL para agregar columna photo_data
const migrationSQL = `
-- Agregar columna photo_data de tipo bytea
ALTER TABLE workers ADD COLUMN IF NOT EXISTS photo_data BYTEA;

-- Nota: Las fotos existentes en photo_url no se migrarán automáticamente
-- Para migrar fotos existentes, necesitarás un script adicional que:
-- 1. Lea los archivos del directorio de uploads
-- 2. Convierta cada archivo a bytea
-- 3. Actualice la columna photo_data para cada trabajador

-- Verificar la estructura actual
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'workers' 
ORDER BY ordinal_position;
`;

// Comando para ejecutar SQL con psql
const command = `psql "host=${dbConfig.host} port=${dbConfig.port} dbname=${dbConfig.database} user=${dbConfig.user} password=${dbConfig.password}" -c "${migrationSQL.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Error al ejecutar la migración:', error.message);
    
    // Si es un error de conexión, mostrar sugerencias
    if (error.message.includes('connection')) {
      console.log('\nSugerencias:');
      console.log('1. Asegúrate de que PostgreSQL esté instalado y ejecutándose');
      console.log('2. Verifica las credenciales en el archivo .env');
      console.log('3. Ejecuta el SQL manualmente en psql:');
      console.log(migrationSQL);
    }
    
    process.exit(1);
  }
  
  if (stderr && !stderr.includes('NOTICE')) {
    console.error('Errores:', stderr);
  }
  
  console.log('Migración completada exitosamente!');
  console.log('Salida:', stdout);
  
  console.log('\nNotas importantes:');
  console.log('1. Se agregó la columna photo_data (bytea) a la tabla workers');
  console.log('2. Las nuevas fotos se almacenarán en la base de datos');
  console.log('3. Las fotos existentes en photo_url permanecerán allí (compatibilidad)');
  console.log('4. El sistema ahora usa el endpoint /api/workers/:id/photo para obtener fotos');
});