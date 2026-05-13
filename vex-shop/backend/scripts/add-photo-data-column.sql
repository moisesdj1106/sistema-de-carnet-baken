-- Migración para agregar columna photo_data (bytea) a la tabla workers
-- Ejecutar en PostgreSQL

-- 1. Agregar columna photo_data de tipo bytea
ALTER TABLE workers ADD COLUMN photo_data BYTEA;

-- 2. Actualizar datos existentes (opcional)
-- Si ya tienes fotos en photo_url y quieres migrarlas a photo_data,
-- necesitarás un script separado para leer los archivos y convertirlos a bytea

-- 3. Nota: La columna photo_url se mantiene por compatibilidad
-- pero ahora será opcional ya que las fotos se almacenarán en photo_data

-- Para verificar la estructura:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workers';