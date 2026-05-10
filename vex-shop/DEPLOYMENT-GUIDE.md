# Guía de Despliegue Completa - Vex Shop

## Resumen del Sistema
- **Frontend:** React + Vite (Netlify)
- **Backend:** Node.js + Express (Render)
- **Base de datos:** PostgreSQL (Aiven)
- **Dominio frontend:** https://horarioempresarial.netlify.app
- **Dominio backend:** https://vexshop-backend.onrender.com (después del despliegue)

## Pasos para el Despliegue

### Paso 1: Configurar Aiven (Base de datos)
1. Asegúrate de que tu instancia de PostgreSQL en Aiven esté activa
2. Verifica las credenciales:
   - Host: `futbolstars-futbolstars.d.aivencloud.com`
   - Puerto: `17167`
   - Base de datos: `defaultdb`
   - Usuario: `avnadmin`
   - Contraseña: `TU_CONTRASEÑA_AIVEN_AQUI`
3. SSL está habilitado automáticamente en Aiven

### Paso 2: Desplegar Backend en Render
1. Ve a [render.com](https://render.com)
2. Crea un nuevo "Web Service"
3. Configura según `backend/README-RENDER.md`
4. Variables de entorno clave:
   ```
   DB_HOST=futbolstars-futbolstars.d.aivencloud.com
   DB_PORT=17167
   DB_NAME=defaultdb
   DB_USER=avnadmin
   DB_PASSWORD=TU_CONTRASEÑA_AIVEN_AQUI
   DB_SSL=true
   FRONTEND_URL=https://horarioempresarial.netlify.app
   ```
5. Espera a que el despliegue termine
6. Obtén la URL del backend (ej: `https://vexshop-backend.onrender.com`)

### Paso 3: Actualizar Frontend
1. Actualiza `frontend/.env.production` con la URL del backend:
   ```
   VITE_API_URL=https://vexshop-backend.onrender.com
   ```
2. Netlify se actualizará automáticamente (si tienes auto-deploy)

### Paso 4: Verificar la Conexión
1. Verifica que el backend responda: `https://vexshop-backend.onrender.com/health`
2. Verifica que el frontend cargue: `https://horarioempresarial.netlify.app`
3. Prueba el login y las funcionalidades principales

## Configuración de SSL

### Aiven (Base de datos)
- SSL está habilitado por defecto
- La configuración en `db.js` usa `rejectUnauthorized: false`
- No se necesitan certificados manuales

### Render (Backend)
- SSL automático con Let's Encrypt
- Certificado gestionado por Render
- URL HTTPS automática

### Netlify (Frontend)
- SSL automático con Let's Encrypt
- Certificado gestionado por Netlify
- HTTPS obligatorio

## Solución de Problemas Comunes

### Error: "Cannot connect to database"
1. Verifica que Aiven esté activo
2. Revisa las credenciales en Render
3. Asegúrate de que `DB_SSL=true`

### Error: "CORS policy"
1. Verifica que `FRONTEND_URL` sea correcta en Render
2. Revisa los logs del backend para ver el origen bloqueado
3. Actualiza la lista de orígenes permitidos en `index.js`

### Error: "Frontend no se conecta al backend"
1. Verifica que `VITE_API_URL` sea correcta
2. Prueba la URL del backend directamente en el navegador
3. Revisa la consola del navegador para errores de red

### Error: "Application error" en Render
1. Revisa los logs de construcción
2. Verifica que `package.json` tenga el script `start`
3. Asegúrate de que todas las dependencias estén instaladas

## Mantenimiento

### Actualizaciones
1. **Backend:** Push a GitHub → Render auto-deploy
2. **Frontend:** Push a GitHub → Netlify auto-deploy
3. **Base de datos:** Backup automático en Aiven

### Monitoreo
1. **Render:** Dashboard con logs y métricas
2. **Netlify:** Analytics y logs de despliegue
3. **Aiven:** Métricas de base de datos

### Costos
- **Render:** Plan Free (hasta 750 horas/mes)
- **Netlify:** Plan Free (100GB/mes bandwidth)
- **Aiven:** Depende del plan (verificar en dashboard)

## Contacto y Soporte
- **Render:** https://render.com/docs
- **Netlify:** https://docs.netlify.com
- **Aiven:** https://help.aiven.io
- **Problemas del código:** Revisar logs y actualizar configuración