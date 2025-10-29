-- Script para crear las tablas necesarias para el sistema de permisos y roles
-- Se asume que ya tienes la tabla 'users' creada con datos

-- 1. Habilitar extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Crear el tipo ENUM para roles (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE role AS ENUM ('admin', 'staff', 'usuario');
    END IF;
END
$$;

-- 3. Añadir columna 'role' a la tabla users si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role role DEFAULT 'usuario';
        -- Actualizar usuarios existentes sin role
        UPDATE users SET role = 'usuario' WHERE role IS NULL;
        -- Hacer la columna NOT NULL después de actualizar
        ALTER TABLE users ALTER COLUMN role SET NOT NULL;
    END IF;
END
$$;

-- 4. Crear tabla 'permissions'
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
ON CONFLICT (name) DO NOTHING; -- No insertar si ya existe

-- 5. Crear tabla 'role_permissions' (tabla de unión)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role role NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_id)
);

-- 6. Asignar permisos a roles
-- Admin: todos los permisos
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Staff: permisos limitados
INSERT INTO role_permissions (role, permission_id)
SELECT 'staff', id FROM permissions 
WHERE name IN ('view_dashboard', 'view_users', 'view_stats')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Usuario: solo ver dashboard
INSERT INTO role_permissions (role, permission_id)
SELECT 'usuario', id FROM permissions
WHERE name = 'view_dashboard'
ON CONFLICT (role, permission_id) DO NOTHING;

-- 7. Configurar Row Level Security (RLS)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para permissions
-- Permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON permissions;
CREATE POLICY "Permitir lectura a usuarios autenticados" ON permissions
    FOR SELECT
    USING (true);

-- Permitir CRUD a administradores
DROP POLICY IF EXISTS "Permitir CRUD a administradores" ON permissions;
CREATE POLICY "Permitir CRUD a administradores" ON permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- 9. Políticas para role_permissions
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON role_permissions;
CREATE POLICY "Permitir lectura a usuarios autenticados" ON role_permissions
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir CRUD a administradores" ON role_permissions;
CREATE POLICY "Permitir CRUD a administradores" ON role_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- 10. Dar permisos básicos
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON permissions TO anon, authenticated;
GRANT SELECT ON role_permissions TO anon, authenticated;
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON role_permissions TO authenticated;

-- 11. Verificar que todo se creó correctamente
SELECT 
    'Tablas creadas' as status,
    COUNT(*) as cantidad
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'permissions', 'role_permissions')
UNION ALL
SELECT 
    'Permisos creados',
    COUNT(*) 
FROM permissions
UNION ALL
SELECT 
    'Asignaciones de permisos',
    COUNT(*) 
FROM role_permissions;

-- Mostrar un usuario admin si existe
SELECT 
    id,
    nombres,
    apellidos,
    correo,
    role
FROM users 
WHERE role = 'admin'
LIMIT 1;

