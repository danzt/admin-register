-- Script para asignar el rol de admin a un usuario
-- Reemplaza 'tu_email@example.com' con el correo del usuario que quieres hacer admin

UPDATE users 
SET role = 'admin' 
WHERE correo = 'tu_email@example.com';

-- Verificar que se actualizó correctamente
SELECT id, nombres, apellidos, correo, role
FROM users 
WHERE correo = 'tu_email@example.com';

