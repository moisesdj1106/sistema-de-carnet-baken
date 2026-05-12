# Configuración de PostgreSQL para VEX Shop

Esta guía te ayudará a configurar PostgreSQL localmente para el proyecto VEX Shop.

## 📋 Requisitos Previos

1. **PostgreSQL instalado** (versión 12 o superior)
2. **pgAdmin** o **psql** (cliente de línea de comandos)
3. **Node.js** 18 o superior

## 🗄️ Configuración de la Base de Datos

### Opción 1: Usando pgAdmin (GUI)

1. **Abrir pgAdmin** y conectarte a tu servidor PostgreSQL
2. **Crear una nueva base de datos:**
   - Nombre: `vex_shop`
   - Propietario: `postgres` (o el usuario que prefieras)
   - Encoding: `UTF8`
   - Collation: `en_US.UTF-8`
   - Character Type: `en_US.UTF-8`

3. **Ejecutar el script SQL:**
   - Abre la herramienta de consultas (Query Tool)
   - Copia y pega el contenido de `database.sql`
   - Ejecuta el script (F5 o botón Execute)

### Opción 2: Usando psql (Línea de Comandos)

```bash
# Conectarte a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE vex_shop;

# Salir de psql
\q

# Ejecutar el script SQL
psql -U postgres -d vex_shop -f database.sql
```

### Opción 3: Usando el Script Automático

```bash
cd vex-shop/backend
npm run init-db
```

**Nota:** Para que el script funcione, asegúrate de que:
- PostgreSQL esté ejecutándose
- Las credenciales en `.env` sean correctas
- Tengas permisos para crear bases de datos

## 🔧 Configuración del Archivo .env

En `vex-shop/backend/.env`, configura:

```env
# Configuración de PostgreSQL LOCAL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vex_shop
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres
DB_SSL=false

# Si usas un usuario diferente
# DB_USER=tu_usuario
# DB_PASSWORD=tu_contraseña
```

## 🔍 Verificar la Conexión

### 1. Verificar que PostgreSQL esté ejecutándose:

**Windows:**
```bash
# Verificar servicio
sc query postgresql

# O en PowerShell
Get-Service postgresql*
```

**Linux/Mac:**
```bash
sudo systemctl status postgresql
```

### 2. Probar conexión desde Node.js:

```bash
cd vex-shop/backend
node -e "const { Pool } = require('pg'); require('dotenv').config(); const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }); pool.query('SELECT NOW()', (err, res) => { if (err) console.error('Error:', err.message); else console.log('Conexión exitosa:', res.rows[0]); pool.end(); });"
```

## 🚀 Iniciar el Proyecto

### Backend (puerto 4000):
```bash
cd vex-shop/backend
npm install
npm run dev
```

### Frontend (puerto 3000):
```bash
cd vex-shop/frontend
npm install
npm run dev
```

## 🌐 URLs de Acceso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health
- **API Docs:** http://localhost:4000/

## 🔐 Credenciales por Defecto

Después de ejecutar `database.sql`, tendrás:
- **Usuario administrador:** `admin`
- **Contraseña:** `admin123`

**Importante:** Cambia la contraseña después del primer login.

## 🛠️ Solución de Problemas

### Error: "password authentication failed"
1. Verifica el usuario y contraseña en `.env`
2. Revisa el archivo `pg_hba.conf` de PostgreSQL
3. Asegúrate de que la autenticación md5 esté habilitada

### Error: "database does not exist"
1. Verifica que la base de datos `vex_shop` esté creada
2. Ejecuta: `CREATE DATABASE vex_shop;`

### Error: "connection refused"
1. Verifica que PostgreSQL esté ejecutándose
2. Revisa el puerto (por defecto es 5432)
3. Verifica el firewall

### Error: "role does not exist"
1. Usa el usuario `postgres` o crea uno nuevo:
```sql
CREATE USER tu_usuario WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE vex_shop TO tu_usuario;
```

## 📊 Estructura de la Base de Datos

Después de ejecutar `database.sql`, tendrás estas tablas:

1. **admins** - Administradores del sistema
2. **positions** - Puestos/departamentos
3. **workers** - Trabajadores
4. **id_cards** - Tarjetas de identificación
5. **attendance_logs** - Registros de asistencia

## 🔄 Reiniciar la Base de Datos

Si necesitas reiniciar desde cero:

```sql
-- Conectarte a PostgreSQL
psql -U postgres

-- Eliminar y recrear la base de datos
DROP DATABASE IF EXISTS vex_shop;
CREATE DATABASE vex_shop;

-- Salir y ejecutar el script
\q
psql -U postgres -d vex_shop -f database.sql
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del backend
2. Verifica las variables de entorno
3. Prueba la conexión manualmente con psql
4. Asegúrate de que todos los servicios estén ejecutándose

¡Listo! Tu base de datos PostgreSQL está configurada y lista para usar. 🎉