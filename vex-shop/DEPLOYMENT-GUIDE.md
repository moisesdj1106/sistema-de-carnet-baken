# Guía de Despliegue Completo - VEX Shop

Esta guía te ayudará a desplegar tanto el frontend (Netlify) como el backend (Render) del sistema VEX Shop.

## Arquitectura

- **Frontend:** React + Vite → Desplegado en **Netlify**
- **Backend:** Node.js + Express + PostgreSQL → Desplegado en **Render**
- **Base de datos:** PostgreSQL → Integrada en **Render**

## Paso 1: Preparar el Repositorio

1. Asegúrate de que tu código esté en GitHub/GitLab
2. Verifica que la estructura sea:
   ```
   vex-shop/
   ├── frontend/      # Aplicación React
   ├── backend/       # API Node.js
   └── database.sql   # Script de base de datos
   ```

## Paso 2: Desplegar el Backend en Render

### 2.1 Crear Web Service en Render

1. Ve a [dashboard.render.com](https://dashboard.render.com/)
2. Haz clic en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Selecciona el directorio `vex-shop/backend`

### 2.2 Configurar el Servicio

**Configuración básica:**
- **Name:** `vex-shop-backend`
- **Environment:** `Node`
- **Region:** `Ohio` (o la más cercana)
- **Branch:** `main`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Variables de entorno:**
```
NODE_ENV=production
PORT=10000
JWT_SECRET=tu-clave-secreta-muy-larga-y-segura-aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tu-frontend.netlify.app
DB_SSL=true
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### 2.3 Crear Base de Datos PostgreSQL

1. En Render, haz clic en "New +" → "PostgreSQL"
2. Configura:
   - **Name:** `vex-shop-db`
   - **Database:** `vex_shop`
   - **User:** `vex_shop_user`
   - **Region:** Misma que el web service
3. Conecta la base de datos al web service

### 2.4 Inicializar la Base de Datos

Después del primer despliegue:

1. Ve a la consola de la base de datos en Render
2. Copia el contenido de `database.sql`
3. Ejecútalo en la pestaña "Query"
4. Verifica que las tablas se hayan creado

## Paso 3: Desplegar el Frontend en Netlify

### 3.1 Preparar el Frontend

1. En el archivo `vex-shop/frontend/.env.production`, configura:
```
VITE_API_URL=https://tu-backend.onrender.com/api
```

2. Construye el frontend localmente para verificar:
```bash
cd vex-shop/frontend
npm install
npm run build
```

### 3.2 Desplegar en Netlify

**Opción A: Desde GitHub (recomendado)**
1. Ve a [app.netlify.com](https://app.netlify.com/)
2. "Add new site" → "Import an existing project"
3. Conecta tu repositorio de GitHub
4. Selecciona el directorio `vex-shop/frontend`
5. Configura:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Agrega variable de entorno:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://tu-backend.onrender.com/api`

**Opción B: Arrastrar y soltar**
1. Construye el proyecto: `npm run build`
2. Arrastra la carpeta `dist` a Netlify
3. Configura la variable de entorno `VITE_API_URL`

## Paso 4: Configurar CORS y URLs

### Backend (Render)
Actualiza `FRONTEND_URL` con la URL de tu frontend en Netlify:
```
FRONTEND_URL=https://tu-sitio.netlify.app
```

### Frontend (Netlify)
Actualiza `VITE_API_URL` con la URL de tu backend en Render:
```
VITE_API_URL=https://tu-backend.onrender.com/api
```

## Paso 5: Probar el Sistema

### 5.1 Verificar Backend
Visita: `https://tu-backend.onrender.com/health`
Deberías ver: `{"status":"ok","timestamp":"...","environment":"production"}`

### 5.2 Verificar Frontend
Visita tu URL de Netlify
Deberías ver la pantalla de login

### 5.3 Credenciales por Defecto
- **Usuario:** `admin`
- **Contraseña:** `admin123`

**Importante:** Cambia la contraseña después del primer login.

## Paso 6: Configuración Avanzada

### Dominio Personalizado
**Netlify:**
1. En "Domain settings" → "Custom domains"
2. Agrega tu dominio
3. Configura los DNS según las instrucciones

**Render:**
1. En tu web service → "Settings" → "Custom Domain"
2. Agrega tu subdominio (ej: `api.tudominio.com`)

### SSL/HTTPS
Tanto Netlify como Render proporcionan SSL automáticamente con Let's Encrypt.

### Almacenamiento de Imágenes
En producción, considera usar:
- **Cloudinary** para almacenamiento de imágenes
- **AWS S3** para almacenamiento de archivos

Para configurar Cloudinary:
1. Actualiza el backend para subir a Cloudinary
2. Configura las variables de entorno:
```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## Solución de Problemas Comunes

### Error de CORS
1. Verifica que `FRONTEND_URL` esté configurada correctamente
2. Asegúrate de que la URL no tenga slash final
3. En desarrollo, usa `http://localhost:5173`

### Error de Conexión a la Base de Datos
1. Verifica que la base de datos esté ejecutándose en Render
2. Confirma que las variables de entorno de DB estén configuradas
3. Verifica que `DB_SSL=true` en producción

### Error 404 en el Frontend (SPA)
En Netlify, crea un archivo `_redirects` en `public/`:
```
/* /index.html 200
```

### Imágenes no se cargan
1. Verifica que el directorio `uploads` exista
2. En Render, configura un disco persistente
3. Considera usar un servicio de almacenamiento externo

## Mantenimiento

### Actualizaciones
1. **Backend:** Los cambios en GitHub se despliegan automáticamente en Render
2. **Frontend:** Los cambios en GitHub se despliegan automáticamente en Netlify
3. **Base de datos:** Haz backup regularmente desde Render Dashboard

### Monitoreo
- **Render:** Revisa logs y métricas en el dashboard
- **Netlify:** Revisa analytics y logs en el dashboard
- **Health checks:** `https://tu-backend.onrender.com/health`

### Backup de Base de Datos
En Render:
1. Ve a tu base de datos → "Settings"
2. "Backups" → "Create manual backup"
3. Descarga el backup regularmente

## Soporte

- **Documentación de Render:** https://render.com/docs
- **Documentación de Netlify:** https://docs.netlify.com
- **Issues del proyecto:** Revisa el repositorio en GitHub

¡Tu sistema VEX Shop ahora está completamente desplegado y listo para usar!