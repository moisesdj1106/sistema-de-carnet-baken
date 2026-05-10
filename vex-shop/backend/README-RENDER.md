# Despliegue en Render

## Pasos para desplegar el backend en Render

### 1. Crear una cuenta en Render
- Ve a [render.com](https://render.com) y crea una cuenta
- Conecta tu cuenta de GitHub/GitLab si usas control de versiones

### 2. Crear un nuevo Web Service
1. Haz clic en "New +" y selecciona "Web Service"
2. Conecta tu repositorio de GitHub/GitLab
3. Selecciona la rama principal (main/master)

### 3. Configurar el servicio
- **Name:** `vexshop-backend`
- **Environment:** `Node`
- **Region:** Elige la más cercana (ej: Oregon, Frankfurt, Singapore)
- **Branch:** `main` o `master`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 4. Configurar variables de entorno
En la sección "Environment Variables", agrega:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=genera_un_secreto_seguro_aqui
DB_HOST=futbolstars-futbolstars.d.aivencloud.com
DB_PORT=17167
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=TU_CONTRASEÑA_AIVEN_AQUI
DB_SSL=true
FRONTEND_URL=https://horarioempresarial.netlify.app
```

### 5. Configuración avanzada
- **Health Check Path:** `/health`
- **Auto-Deploy:** Activar (recomendado)
- **Plan:** Free (para empezar)

### 6. Desplegar
- Haz clic en "Create Web Service"
- Render comenzará a construir y desplegar tu aplicación
- La URL será: `https://vexshop-backend.onrender.com`

## Configuración del frontend
Una vez desplegado el backend, actualiza el archivo `.env.production` del frontend:

```
VITE_API_URL=https://vexshop-backend.onrender.com
```

## Solución de problemas

### Error de conexión a la base de datos
1. Verifica que las credenciales de Aiven sean correctas
2. Asegúrate de que `DB_SSL=true`
3. Verifica que el host y puerto sean correctos

### Error de CORS
1. Verifica que `FRONTEND_URL` sea correcta
2. Revisa los logs de Render para ver los orígenes bloqueados

### El servicio no inicia
1. Revisa los logs de construcción en Render
2. Verifica que `package.json` tenga el script `start`
3. Asegúrate de que el puerto 10000 esté disponible