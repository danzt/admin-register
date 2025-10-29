-- Script para agregar la columna role a la tabla users
-- Usa este si el script anterior falló

-- 1. Crear el tipo ENUM para roles si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE role AS ENUM ('admin', 'staff', 'usuario');
        RAISE NOTICE 'Tipo role creado exitosamente';
    ELSE
        RAISE NOTICE 'Tipo role ya existe';
    END IF;
END
$$;

-- 2. Verificar si la columna role existe en users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        RAISE NOTICE 'La columna role ya existe en users';
    ELSE
        RAISE NOTICE 'La columna role NO existe, se creará ahora';
    END IF;
END
$$;

-- 3. Agregar la columna role (sin NOT NULL primero)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role role DEFAULT 'usuario';

-- 4. Actualizar usuarios existentes sin role
UPDATE users SET role = 'usuario' WHERE role IS NULL;

-- 5. Hacer la columna NOT NULL después de actualizar
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- 6. Verificar que se agregó correctamente
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

