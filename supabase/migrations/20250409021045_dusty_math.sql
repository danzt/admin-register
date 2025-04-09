-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula TEXT NOT NULL UNIQUE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  fecha_bautizo TIMESTAMP,
  whatsapp BOOLEAN DEFAULT FALSE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role for application users
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user;
  END IF;
END
$$;

-- Grant permissions to app_user role
GRANT CONNECT ON DATABASE paypal_clone TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;

-- Create function to create application users
CREATE OR REPLACE FUNCTION create_app_user(
  p_username TEXT,
  p_password TEXT
) RETURNS void AS $$
BEGIN
  EXECUTE format('CREATE USER %I WITH PASSWORD %L', p_username, p_password);
  EXECUTE format('GRANT app_user TO %I', p_username);
END;
$$ LANGUAGE plpgsql;