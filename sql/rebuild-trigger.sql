-- Eliminar y recrear el trigger con el tipo role existente

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crear la función del trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.email,
    false,
    '',
    'usuario'::role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay un error, retornar NEW sin hacer nada
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

