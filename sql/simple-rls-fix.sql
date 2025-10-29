-- Script simple para arreglar las políticas RLS sin romper el login
-- Este script es más conservador y solo arregla el problema específico

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

-- 2. Eliminar solo las políticas problemáticas (mantener las que funcionan)
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_select_service_role" ON users;
DROP POLICY IF EXISTS "users_admin_select_all" ON users;
DROP POLICY IF EXISTS "users_own_select" ON users;
DROP POLICY IF EXISTS "users_service_role_select" ON users;

-- 3. Crear políticas simples y robustas
-- Política para que los admins vean todos los usuarios
CREATE POLICY "admin_can_see_all_users" ON users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
        )
    );

-- Política para que los usuarios vean sus propios datos
CREATE POLICY "users_can_see_own_data" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = id::text);

-- Política para service_role (APIs del servidor)
CREATE POLICY "service_role_can_see_all" ON users
    FOR SELECT
    TO service_role
    USING (true);

-- 4. Asegurar permisos básicos
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO service_role;

-- 5. Verificar que las políticas se crearon
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
