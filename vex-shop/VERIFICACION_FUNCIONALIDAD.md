# Lista de Verificación de Funcionalidad

Después de que Render y Netlify completen los despliegues, verifica lo siguiente:

## 1. Verificar despliegues completados
- [ ] Backend en Render: https://sistema-de-carnet-baken.onrender.com/health
  - Debería mostrar `{"status":"ok","timestamp":"...","environment":"production","service":"VEX Shop API"}`
- [ ] Frontend en Netlify: https://horariocarnet.netlify.app
  - Debería cargar la página de login/escaneo

## 2. Probar escaneo
- [ ] Ir a https://horariocarnet.netlify.app
- [ ] Escanear un código QR o ingresar código manualmente
- [ ] Verificar que muestre:
  - ✅ Foto del trabajador (si tiene)
  - ✅ Nombre del trabajador
  - ✅ "ENTRADA" o "SALIDA" (no "DESCONOCIDO")
  - ✅ Hora del registro

## 3. Probar imágenes en módulos
- [ ] Iniciar sesión como admin
- [ ] Ir a "Trabajadores"
- [ ] Verificar que las fotos se muestren
- [ ] Ir a "Carnets"
- [ ] Verificar que las fotos se muestren en las tarjetas
- [ ] Ir a "Asistencia de Hoy"
- [ ] Verificar que las fotos se muestren

## 4. Probar eliminación de foto
- [ ] Ir a "Trabajadores"
- [ ] Editar un trabajador que tenga foto
- [ ] Hacer clic en "✕ Quitar foto"
- [ ] Confirmar eliminación
- [ ] Verificar que la foto se elimine
- [ ] Guardar cambios
- [ ] Verificar que el trabajador ya no tenga foto en la lista

## 5. Probar otras funcionalidades
- [ ] Crear nuevo trabajador con foto
- [ ] Generar carnet para trabajador
- [ ] Escanear carnet (debería alternar entre ENTRADA/SALIDA)
- [ ] Ver reporte quincenal

## Solución de Problemas

### Si las imágenes no se muestran:
1. Verificar que `VITE_BACKEND_URL` esté configurado en Netlify
2. Abrir consola del navegador (F12) y revisar errores
3. Verificar que las rutas de imágenes sean correctas

### Si el escaneo muestra "DESCONOCIDO":
1. Abrir consola del navegador (F12)
2. Verificar la respuesta del endpoint `/api/attendance/scan`
3. Debería tener `event_type` en la respuesta

### Si no se puede eliminar foto:
1. Verificar que estás editando un trabajador existente
2. El trabajador debe tener foto
3. Revisar consola del navegador para errores

## Contacto para Soporte
Si algún problema persiste después de verificar lo anterior:
1. Revisar logs de Render: https://dashboard.render.com
2. Revisar logs de Netlify: https://app.netlify.com
3. Proporcionar capturas de pantalla de los errores en consola