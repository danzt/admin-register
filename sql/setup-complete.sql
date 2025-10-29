-- Setup completo para el proyecto
-- EJECUTA ESTE SCRIPT COMPLETO EN ORDEN

-- ============================================
-- PARTE 1: Crear el tipo ENUM 'role'
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE role AS ENUM ('admin', 'staff', 'usuario');
        RAISE NOTICE '✓ Tipo role creado exitosamente';
    ELSE
        RAISE NOTICE '✓ Tipo role ya existe';
    END IF;
END
$$;

-- ============================================
-- PARTE 2: Agregar columna role a users
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role role DEFAULT 'usuario';
        UPDATE users SET role = 'usuario' WHERE role IS NULL;
        ALTER TABLE users ALTER COLUMN role SET NOT NULL;
        RAISE NOTICE '✓ Columna role agregada a users';
    ELSE
        RAISE NOTICE '✓ Columna role ya existe en users';
    END IF;
END
$$;

-- ============================================
-- PARTE 3: Crear tablas de permisos
-- ============================================

-- Crear tabla 'permissions'
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar permisos por defecto
INSERT INTO permissions (name, description) 
VALUES 
    ('view_dashboard', 'Puede ver el dashboard principal'),
    ('manage_users', 'Puede gestionar usuarios (añadir, editar, eliminar)'),
    ('view_users', 'Puede ver el listado de usuarios'),
    ('manage_roles', 'Puede gestionar roles y permisos'),
    ('import_users', 'Puede importar usuarios masivamente'),
    ('view_stats', 'Puede ver estadísticas')
ON CONFLICT (name) DO NOTHING;

-- Crear tabla 'role_permissions'
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role role NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_id)
);

-- Asignar permisos a roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'staff', id FROM permissions 
WHERE name IN ('view_dashboard', 'view_users', 'view_stats')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'usuario', id FROM permissions
WHERE name = 'view_dashboard'
ON CONFLICT (role, permission_id) DO NOTHING;

-- ============================================
-- PARTE 4: Configurar RLS
-- ============================================
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura permissions" ON permissions;
CREATE POLICY "Permitir lectura permissions" ON permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir CRUD permissions admin" ON permissions;
CREATE POLICY "Permitir CRUD permissions admin" ON permissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id::text = auth.uid()::text
        AND users.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Permitir lectura role_permissions" ON role_permissions;
CREATE POLICY "Permitir lectura role_permissions" ON role_permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir CRUD role_permissions admin" ON role_permissions;
CREATE POLICY "Permitir CRUD role_permissions admin" ON role_permissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id::text = auth.uid()::text
        AND users.role = 'admin'
    )
);

-- ============================================
-- PARTE 5: Crear o actualizar el trigger de Auth
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PARTE 6: Verificar que todo está bien
-- ============================================
SELECT '✓ Setup completado' as status;
SELECT 'Roles disponibles: ' || array_agg(unnest)::text FROM unnest(ARRAY['admin', 'staff', 'usuario']);

