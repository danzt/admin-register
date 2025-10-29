-- Script para arreglar las políticas RLS que pueden estar causando problemas
-- al cambiar entre vistas

-- 1. Verificar el estado actual de RLS
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

-- 2. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- 3. Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_select_service_role" ON users;

-- 4. Crear una política más simple y robusta para administradores
-- Esta política permite a los admins ver todos los usuarios
CREATE POLICY "users_admin_select_all" ON users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
        )
    );

-- 5. Crear política para usuarios normales (solo sus propios datos)
CREATE POLICY "users_own_select" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = id::text);

-- 6. Crear política para service_role (APIs del servidor)
CREATE POLICY "users_service_role_select" ON users
    FOR SELECT
    TO service_role
    USING (true);

-- 7. Asegurar que los permisos estén correctos
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO service_role;

-- 8. Verificar que las nuevas políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 9. Probar la consulta como si fuera un admin
-- (Esto te ayudará a verificar si las políticas funcionan)
SELECT 
    id,
    cedula,
    nombres,
    apellidos,
    role,
    created_at
FROM users
LIMIT 5;