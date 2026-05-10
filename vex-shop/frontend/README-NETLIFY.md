# Despliegue en Netlify

## Pasos para desplegar el frontend en Netlify

### 1. Conectar el repositorio
1. Ve a [netlify.com](https://netlify.com) y crea una cuenta
2. Haz clic en "Add new site" → "Import an existing project"
3. Conecta tu cuenta de GitHub/GitLab
4. Selecciona el repositorio `vex-shop`

### 2. Configurar el despliegue
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Branch to deploy:** `main` o `master`

### 3. Variables de entorno
En la sección "Environment variables", agrega:

```
VITE_API_URL=https://vexshop-backend.onrender.com
```

### 4. Configuración del dominio
1. Netlify asignará un dominio automático (ej: `nombre-aleatorio.netlify.app`)
2. Puedes configurar un dominio personalizado en "Domain settings"
3. Para tu caso, ya tienes: `horarioempresarial.netlify.app`

### 5. Configurar redirecciones
El archivo `netlify.toml` ya está configurado para SPA (Single Page Application):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 6. Desplegar
- Netlify desplegará automáticamente cuando hagas push a la rama principal
- También puedes desplegar manualmente desde el dashboard

## Solución de problemas

### Error de construcción
1. Revisa los logs de Netlify
2. Verifica que todas las dependencias estén en package.json
3. Asegúrate de que Node.js versión 18+ esté disponible

### Error de conexión con el backend
1. Verifica que `VITE_API_URL` sea correcta
2. Asegúrate de que el backend esté funcionando en Render
3. Verifica los logs de CORS en el backend

### La aplicación no carga
1. Verifica que el archivo `index.html` esté en la carpeta `dist`
2. Revisa la configuración de redirecciones
3. Prueba con `npm run build` localmente primero