-- Habilitar extensión pgcrypto para hash de contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS public.users (
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

-- Configurar políticas de Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura solo a usuarios autenticados sobre sus propios datos
CREATE POLICY "Usuarios pueden ver su propia información" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'service_role');

-- Política para permitir inserción desde la API de servicio
CREATE POLICY "Servicio puede insertar usuarios" ON public.users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() IS NOT NULL);

-- Política para permitir actualización solo a usuarios autenticados sobre sus propios datos
CREATE POLICY "Usuarios pueden actualizar su propia información" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'service_role');

-- Dar permisos anónimos para inserción (necesario para registro)
GRANT INSERT ON public.users TO anon;