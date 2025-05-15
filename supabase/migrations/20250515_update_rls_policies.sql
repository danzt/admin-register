-- Desactivar y reactivar RLS para permissions
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Desactivar y reactivar RLS para role_permissions
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso de lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura a usuarios autenticados" ON permissions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Crear política para permitir operaciones CRUD a usuarios con rol 'admin'
CREATE POLICY "Permitir CRUD a administradores" ON permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Crear política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura a usuarios autenticados" ON role_permissions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Crear política para permitir operaciones CRUD a usuarios con rol 'admin'
CREATE POLICY "Permitir CRUD a administradores" ON role_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Asegurarse de que el esquema público sea accesible para el rol anon y authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Dar permisos de SELECT a anon y authenticated
GRANT SELECT ON permissions TO anon, authenticated;
GRANT SELECT ON role_permissions TO anon, authenticated;

-- Dar permisos completos a authenticated (los administradores serán filtrados por RLS)
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON role_permissions TO authenticated;

-- Dar permisos completos en las secuencias asociadas si es necesario
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 