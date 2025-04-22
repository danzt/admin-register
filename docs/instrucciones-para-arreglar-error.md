# Solucionar el error "relation 'public.users' does not exist"

Este error ocurre porque la tabla `users` que necesita tu aplicación no ha sido creada en la base de datos de Supabase. Sigue estos pasos para crear la tabla y resolver el problema:

## Pasos para solucionar el error

1. **Accede al panel de control de Supabase**

   - Inicia sesión en [app.supabase.com](https://app.supabase.com)
   - Selecciona tu proyecto

2. **Abre el Editor SQL**

   - En el menú lateral izquierdo, haz clic en "SQL Editor"
   - Haz clic en "New Query" para crear una nueva consulta

3. **Ejecuta el siguiente código SQL**
   - Copia y pega el contenido del archivo `docs/crear-tabla-users.sql`
   - Haz clic en "Run" para ejecutar la consulta

```sql
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
```

4. **Verifica que la tabla se haya creado correctamente**

   - En el menú lateral izquierdo, haz clic en "Table Editor"
   - Deberías ver la tabla `users` en la lista

5. **Desactiva la confirmación de correo electrónico (opcional pero recomendado)**

   - Ve a "Authentication" > "Providers" en el menú lateral
   - En la sección "Email", desactiva la opción "Confirm email"
   - Guarda los cambios

6. **Reinicia tu aplicación**
   - Vuelve a tu aplicación e intenta iniciar sesión de nuevo

## Comprobación adicional

Si sigues experimentando problemas, puedes verificar si la tabla `users` existe ejecutando esta consulta en el Editor SQL:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'users'
);
```

Debería devolver `true` si la tabla existe correctamente.

## Modificación de permisos (si es necesario)

Si encuentras problemas con los permisos, puedes ejecutar este comando adicional:

```sql
GRANT ALL PRIVILEGES ON TABLE public.users TO postgres, authenticated, anon, service_role;
```

Esto otorgará todos los permisos necesarios a los diferentes roles de Supabase.
