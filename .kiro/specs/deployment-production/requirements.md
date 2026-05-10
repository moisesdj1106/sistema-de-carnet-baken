# Requirements Document

## Introduction

El sistema Vex Shop es una aplicación web para control de asistencia de trabajadores que necesita ser desplegada a producción. El frontend se desplegará en Netlify y el backend en Render, con una base de datos PostgreSQL. Este documento define los requisitos para configurar correctamente el despliegue en producción.

## Glossary

- **Frontend**: Aplicación React que se ejecuta en el navegador del usuario
- **Backend**: Servidor Node.js/Express que maneja la lógica de negocio y API
- **Netlify**: Plataforma de hosting para aplicaciones frontend estáticas
- **Render**: Plataforma de hosting para aplicaciones backend y bases de datos
- **PostgreSQL**: Sistema de gestión de bases de datos relacional
- **CORS**: Cross-Origin Resource Sharing, mecanismo de seguridad para peticiones entre dominios
- **Variables de entorno**: Configuraciones que varían entre entornos (desarrollo, producción)

## Requirements

### Requirement 1: Configuración de Variables de Entorno

**User Story:** Como administrador del sistema, quiero configurar correctamente las variables de entorno para producción, para que la aplicación funcione correctamente en el entorno de producción.

#### Acceptance Criteria

1. THE Backend SHALL leer las variables de entorno desde el archivo .env en desarrollo y desde las variables configuradas en Render en producción
2. THE Frontend SHALL leer la URL del backend desde la variable VITE_API_URL configurada en Netlify
3. WHEN se despliega el backend en Render, THE Render SHALL configurar automáticamente las variables de entorno para la base de datos PostgreSQL
4. WHERE se requiere seguridad, THE JWT_SECRET SHALL ser generado automáticamente y almacenado de forma segura
5. IF falta alguna variable de entorno requerida, THEN THE Sistema SHALL registrar un error descriptivo y no iniciar

### Requirement 2: Conexión Frontend-Backend

**User Story:** Como usuario, quiero que el frontend se conecte correctamente al backend en producción, para que todas las funcionalidades de la aplicación funcionen.

#### Acceptance Criteria

1. WHEN el frontend hace una petición al backend, THE Frontend SHALL usar la URL configurada en VITE_API_URL
2. THE Backend SHALL aceptar peticiones desde el dominio del frontend desplegado en Netlify
3. WHERE se requieren credenciales, THE Backend SHALL incluir el encabezado Access-Control-Allow-Credentials
4. IF el backend no está disponible, THEN THE Frontend SHALL mostrar un mensaje de error apropiado al usuario

### Requirement 3: Configuración de Seguridad CORS

**User Story:** Como desarrollador, quiero configurar correctamente CORS para producción, para que las peticiones entre frontend y backend sean seguras.

#### Acceptance Criteria

1. THE Backend SHALL permitir peticiones solo desde los dominios autorizados (Netlify y localhost para desarrollo)
2. WHEN se recibe una petición de un origen no autorizado, THEN THE Backend SHALL rechazar la petición con error CORS
3. THE Backend SHALL incluir los encabezados CORS necesarios en todas las respuestas
4. WHERE se requieren cookies o autenticación, THE Backend SHALL permitir credenciales en peticiones CORS

### Requirement 4: Configuración de Base de Datos en Producción

**User Story:** Como administrador, quiero configurar la base de datos PostgreSQL para producción, para que los datos de la aplicación sean persistentes y seguros.

#### Acceptance Criteria

1. WHEN se despliega el backend en Render, THE Render SHALL crear o conectar a una base de datos PostgreSQL
2. THE Backend SHALL usar las credenciales de base de datos proporcionadas por Render
3. WHERE se requiere migración de datos, THE Administrador SHALL ejecutar el script database.sql en la base de datos de producción
4. IF la conexión a la base de datos falla, THEN THE Backend SHALL reintentar la conexión con backoff exponencial

### Requirement 5: Proceso de Despliegue Paso a Paso

**User Story:** Como usuario, quiero un proceso claro paso a paso para desplegar la aplicación, para que pueda hacerlo sin problemas técnicos.

#### Acceptance Criteria

1. THE Documentación SHALL proporcionar pasos secuenciales para desplegar el backend en Render
2. THE Documentación SHALL proporcionar pasos secuenciales para desplegar el frontend en Netlify
3. WHERE se requiere configuración manual, THE Documentación SHALL incluir capturas de pantalla o ejemplos claros
4. WHEN ocurre un error durante el despliegue, THEN THE Documentación SHALL incluir soluciones comunes a problemas

### Requirement 6: Configuración de Archivos Estáticos

**User Story:** Como usuario, quiero que las fotos de trabajadores se almacenen y sirvan correctamente en producción, para que la funcionalidad de fotos funcione.

#### Acceptance Criteria

1. THE Backend SHALL servir archivos estáticos desde el directorio /uploads en producción
2. WHEN se sube una foto, THE Backend SHALL almacenarla en un servicio de almacenamiento persistente
3. WHERE se requiere persistencia de archivos, THE Sistema SHALL usar un servicio de almacenamiento en la nube o volúmenes persistentes
4. IF el almacenamiento de archivos falla, THEN THE Sistema SHALL registrar el error pero continuar operando

### Requirement 7: Monitoreo y Logs

**User Story:** Como administrador, quiero monitorear el rendimiento y errores de la aplicación en producción, para poder solucionar problemas rápidamente.

#### Acceptance Criteria

1. THE Backend SHALL registrar logs estructurados con información de cada petición
2. WHEN ocurre un error, THEN THE Backend SHALL registrar el error con contexto suficiente para diagnóstico
3. THE Render SHALL proporcionar métricas básicas de rendimiento del backend
4. THE Netlify SHALL proporcionar métricas básicas de tráfico del frontend

### Requirement 8: Configuración de Dominio Personalizado (Opcional)

**User Story:** Como administrador, quiero usar un dominio personalizado para la aplicación, para que sea más profesional y fácil de recordar.

#### Acceptance Criteria

1. WHERE se configura un dominio personalizado, THE Netlify SHALL permitir la configuración de DNS
2. WHERE se configura un dominio personalizado, THE Render SHALL permitir la configuración de nombre personalizado para el backend
3. WHEN se usa HTTPS, THEN THE Sistema SHALL usar certificados SSL válidos automáticamente
4. IF hay problemas con el dominio, THEN THE Documentación SHALL incluir pasos para verificar la configuración DNS