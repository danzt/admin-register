-- Script para revertir la migración si es necesario
-- Elimina los registros que fueron creados desde users_old

DELETE FROM public.users
WHERE 
  id IN (
    SELECT id FROM public.users_old
  )
  OR password_hash LIKE 'password_temp_change_me_%';

-- Verificar resultados
SELECT 
  'Registros eliminados' as descripcion,
  COUNT(*) as cantidad
FROM public.users
WHERE 
  id IN (SELECT id FROM public.users_old)
  OR password_hash LIKE 'password_temp_change_me_%';

