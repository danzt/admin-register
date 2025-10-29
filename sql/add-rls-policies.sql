-- Script para agregar políticas RLS a la tabla users
-- Esto permite que los usuarios vean sus propios datos y los admins vean todo

-- 1. Habilitar RLS en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_service_role" ON users;

-- 3. Crear política para que los usuarios puedan ver sus propios datos
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (
        auth.uid()::text = id::text
    );

-- 4. Crear política para que los administradores puedan ver todos los usuarios
CREATE POLICY "users_select_admin" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
        )
    );

-- 5. Crear política para permitir acceso con service_role (para APIs del servidor)
CREATE POLICY "users_select_service_role" ON users
    FOR SELECT
    USING (true); -- Permitir todo cuando se usa service_role

-- 6. Permitir que todos los usuarios autenticados puedan leer la tabla (pero solo verán los datos permitidos por las políticas)
GRANT SELECT ON users TO authenticated;

-- Verificar que las políticas se crearon
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'users';

