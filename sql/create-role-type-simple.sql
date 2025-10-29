-- Script simple para crear el tipo role
-- Ejecuta esto PRIMERO

-- Crear el tipo ENUM 'role' si no existe
CREATE TYPE role AS ENUM ('admin', 'staff', 'usuario');

-- Verificar que se creó
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'role';

