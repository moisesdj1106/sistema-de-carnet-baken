-- VEX SHOP - Sistema de Control de Asistencia
-- Base de datos PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de administradores
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de departamentos/puestos
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Tabla de trabajadores
CREATE TABLE workers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  position_id INT REFERENCES positions(id),
  email VARCHAR(150),
  phone VARCHAR(20),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de carnets (tarjetas de identificación)
CREATE TABLE id_cards (
  id SERIAL PRIMARY KEY,
  worker_id INT REFERENCES workers(id) ON DELETE CASCADE,
  card_code VARCHAR(50) UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  qr_data TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de registros de asistencia
CREATE TABLE attendance_logs (
  id SERIAL PRIMARY KEY,
  worker_id INT REFERENCES workers(id),
  card_id INT REFERENCES id_cards(id),
  event_type VARCHAR(10) CHECK (event_type IN ('entry', 'exit')) NOT NULL,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_attendance_worker ON attendance_logs(worker_id);
CREATE INDEX idx_attendance_date ON attendance_logs(logged_at);
CREATE INDEX idx_card_code ON id_cards(card_code);

-- Admin por defecto (password: admin123)
-- NOTA: El hash abajo corresponde a "admin123" con bcrypt rounds=10
-- Puedes cambiar la contraseña desde el panel de Administradores una vez dentro
-- O simplemente ve a /register para crear el primer admin desde la interfaz
INSERT INTO admins (username, password_hash) VALUES (
  'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);
-- Para crear más admins usa el módulo "Administradores" dentro del panel (requiere estar logueado)

-- Puestos de ejemplo
INSERT INTO positions (name) VALUES ('Cajero'), ('Vendedor'), ('Supervisor'), ('Almacén'), ('Gerente');
