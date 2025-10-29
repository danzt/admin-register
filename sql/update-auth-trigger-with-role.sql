-- Actualizar el trigger de Supabase Auth para incluir la columna role
-- Ejecuta este SQL si ya tienes usuarios creados desde el panel de Supabase

-- Eliminar el trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crear la función actualizada con role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en la tabla users mapeando email a correo y agregando role
  INSERT INTO public.users (
    id,
    cedula,
    nombres,
    apellidos,
    telefono,
    direccion,
    correo,
    whatsapp,
    password_hash,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'cedula', 'SIN_CEDULA_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'nombres', 'Sin nombre'),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', 'Sin apellido'),
    'Sin teléfono',
    'Sin dirección',
    NEW.email,  -- Mapear email de auth.users a correo de public.users
    false,
    '',  -- Password hash se maneja por Supabase Auth
    'usuario'::role  -- Asignar rol por defecto
  )
  ON CONFLICT (id) DO NOTHING;  -- Evitar errores si ya existe
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar que el trigger se creó
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

