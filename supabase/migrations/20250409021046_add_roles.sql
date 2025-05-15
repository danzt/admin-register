-- PARTE 1: Crear el tipo ENUM y añadir la columna primero
-- Verificar si ya existe el tipo role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        -- Create role enum type
        CREATE TYPE role AS ENUM ('admin', 'staff', 'usuario');
    END IF;
END
$$;

-- Verificar si ya existe la columna role en la tabla users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        -- Add role column to users table with default value
        ALTER TABLE users ADD COLUMN role role NOT NULL DEFAULT 'usuario';
    END IF;
END
$$;

-- PARTE 2: Crear las tablas de permisos
-- Verificar si ya existe la tabla permissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'permissions'
    ) THEN
        -- Create permissions table
        CREATE TABLE permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert some default permissions
        INSERT INTO permissions (name, description) VALUES
          ('view_dashboard', 'Puede ver el dashboard principal'),
          ('manage_users', 'Puede gestionar usuarios (añadir, editar, eliminar)'),
          ('view_users', 'Puede ver el listado de usuarios'),
          ('manage_roles', 'Puede gestionar roles y permisos'),
          ('import_users', 'Puede importar usuarios masivamente'),
          ('view_stats', 'Puede ver estadísticas');
    END IF;
END
$$;

-- Verificar si ya existe la tabla role_permissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'role_permissions'
    ) THEN
        -- Create role_permissions junction table
        CREATE TABLE role_permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          role role NOT NULL,
          permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Assign permissions to roles only if the tables exist
        -- Admin role (all permissions)
        INSERT INTO role_permissions (role, permission_id)
        SELECT 'admin', id FROM permissions;

        -- Staff role (limited permissions)
        INSERT INTO role_permissions (role, permission_id)
        SELECT 'staff', id FROM permissions 
        WHERE name IN ('view_dashboard', 'view_users', 'view_stats');

        -- Usuario role (minimal permissions)
        INSERT INTO role_permissions (role, permission_id)
        SELECT 'usuario', id FROM permissions
        WHERE name IN ('view_dashboard');
    END IF;
END
$$;

-- PARTE 3: Ahora que sabemos que la columna role existe, creamos el usuario admin si es necesario
-- Create first admin user if no users with admin role exist
DO $$
BEGIN
  -- Ya podemos verificar si hay usuarios con rol admin porque la columna ya existe
  IF (SELECT COUNT(*) FROM users WHERE role = 'admin') = 0 THEN
    INSERT INTO users (
      cedula, 
      nombres, 
      apellidos, 
      telefono, 
      direccion, 
      correo, 
      password_hash, 
      role
    )
    VALUES (
      'ADMIN',
      'Administrador',
      'Sistema',
      '0000000000',
      'Administración',
      'admin@sistema.com',
      crypt('admin123', gen_salt('bf')),
      'admin'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Capturar cualquier error en esta parte
    RAISE NOTICE 'Error al crear usuario admin: %', SQLERRM;
END
$$; 