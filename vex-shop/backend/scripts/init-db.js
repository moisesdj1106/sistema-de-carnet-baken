#!/usr/bin/env node

/**
 * Script para inicializar la base de datos
 * Uso: node scripts/init-db.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sqlFile = path.join(__dirname, '..', '..', 'database.sql');

if (!fs.existsSync(sqlFile)) {
  console.error('Error: No se encontró el archivo database.sql');
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vex_shop',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

console.log('Inicializando base de datos VEX Shop...');
console.log('Configuración:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user
});

// Comando para ejecutar SQL con psql
const command = `psql "host=${dbConfig.host} port=${dbConfig.port} dbname=${dbConfig.database} user=${dbConfig.user} password=${dbConfig.password}" -c "${sqlContent.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Error al ejecutar el script SQL:', error.message);
    
    // Si es un error de conexión, mostrar sugerencias
    if (error.message.includes('connection')) {
      console.log('\nSugerencias:');
      console.log('1. Asegúrate de que PostgreSQL esté instalado y ejecutándose');
      console.log('2. Verifica las credenciales en el archivo .env');
      console.log('3. Crea la base de datos manualmente:');
      console.log(`   createdb -U postgres ${dbConfig.database}`);
      console.log('4. Ejecuta el script SQL manualmente:');
      console.log(`   psql -U ${dbConfig.user} -d ${dbConfig.database} -f ${sqlFile}`);
    }
    
    process.exit(1);
  }
  
  if (stderr && !stderr.includes('NOTICE')) {
    console.error('Errores:', stderr);
  }
  
  console.log('Base de datos inicializada exitosamente!');
  console.log('Salida:', stdout);
  
  console.log('\nCredenciales por defecto:');
  console.log('Usuario: admin');
  console.log('Contraseña: admin123');
  console.log('\nPuedes cambiar la contraseña desde el panel de administración.');
});