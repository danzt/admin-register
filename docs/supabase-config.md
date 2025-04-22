# Configuración de Supabase

Para que la aplicación funcione correctamente sin enviar correos de confirmación, debes seguir estos pasos en tu proyecto de Supabase:

## Desactivar confirmación de correo electrónico

1. Inicia sesión en tu [Dashboard de Supabase](https://app.supabase.io)
2. Navega a tu proyecto
3. Ve a "Authentication" > "Providers"
4. En la sección "Email", desactiva la opción "Confirm email"
5. Guarda los cambios

Con esto, los usuarios podrán registrarse sin necesidad de confirmar su correo electrónico.

## Crear las tablas necesarias

Ejecuta la siguiente SQL en el editor SQL de Supabase:

```sql
-- Habilitar extensión pgcrypto para hash de contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear tabla de usuarios
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

-- Configurar políticas de Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura solo a usuarios autenticados
CREATE POLICY "Usuarios pueden ver su propia información" ON users
  FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'service_role');

-- Política para permitir inserción a través de la API
CREATE POLICY "Servicio puede insertar usuarios" ON users
  FOR INSERT TO service_role USING (true);

-- Política para permitir actualización solo a usuarios autenticados sobre sus propios datos
CREATE POLICY "Usuarios pueden actualizar su propia información" ON users
  FOR UPDATE USING (auth.uid() = id);
```

## Configurar variables de entorno

Asegúrate de que las siguientes variables de entorno estén configuradas en tu archivo `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://bhtrlwkmcchobwpjkait.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodHJsd2ttY2Nob2J3cGprYWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNjU5OTcsImV4cCI6MjA1OTc0MTk5N30.IrE38FykEQ0OWJsfQyoUE9C7lbVyrmZlSYneoIXSYnA
```

Reemplaza estos valores con los de tu propio proyecto de Supabase.
