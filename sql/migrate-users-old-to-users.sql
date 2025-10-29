-- Script de migración de datos de users_old a users
-- Mapea los campos del nuevo schema (inglés) al schema actual (español)

INSERT INTO public.users (
  id,
  cedula,
  nombres,
  apellidos,
  telefono,
  direccion,
  correo,
  fecha_bautizo,
  whatsapp,
  password_hash,
  created_at,
  updated_at
)
SELECT 
  -- Mapear ID - usar el de users_old si existe, sino generar nuevo
  COALESCE(uo.id, gen_random_uuid()) as id,
  
  -- Mapear cédula desde id_number
  COALESCE(NULLIF(TRIM(uo.id_number), ''), 'SIN_CEDULA_' || substring(gen_random_uuid()::text, 1, 8)) as cedula,
  
  -- Mapear nombres desde first_name
  COALESCE(NULLIF(TRIM(uo.first_name), ''), 'Sin nombre') as nombres,
  
  -- Mapear apellidos desde last_name
  COALESCE(NULLIF(TRIM(uo.last_name), ''), 'Sin apellido') as apellidos,
  
  -- Mapear teléfono
  COALESCE(NULLIF(TRIM(uo.phone), ''), 'Sin teléfono') as telefono,
  
  -- Mapear dirección
  COALESCE(NULLIF(TRIM(uo.address), ''), 'Sin dirección') as direccion,
  
  -- Mapear correo electrónico
  COALESCE(NULLIF(TRIM(uo.email), ''), 'sin_correo_' || substring(gen_random_uuid()::text, 1, 8) || '@example.com') as correo,
  
  -- Mapear fecha de bautizo desde baptism_date (preferido) o birth_date
  COALESCE(uo.baptism_date, NULL) as fecha_bautizo,
  
  -- Mapear WhatsApp (ya existe en ambas tablas)
  COALESCE(uo.whatsapp, false) as whatsapp,
  
  -- Password hash: usar un hash por defecto para usuarios migrados
  crypt('password_temp_change_me_' || substring(gen_random_uuid()::text, 1, 12), gen_salt('bf')) as password_hash,
  
  -- Timestamps
  COALESCE(uo.created_at, CURRENT_TIMESTAMP) as created_at,
  COALESCE(uo.updated_at, CURRENT_TIMESTAMP) as updated_at
  
FROM public.users_old uo
WHERE 
  -- Solo migrar si el email no existe ya en users
  NOT EXISTS (
    SELECT 1 
    FROM public.users u 
    WHERE LOWER(TRIM(u.correo)) = LOWER(TRIM(uo.email))
  )
  -- Solo migrar si tenemos al menos email o first_name
  AND (
    NULLIF(TRIM(uo.email), '') IS NOT NULL 
    OR NULLIF(TRIM(uo.first_name), '') IS NOT NULL
  );

-- Verificar resultados
SELECT 
  'Registros en users_old' as descripcion,
  COUNT(*) as cantidad
FROM public.users_old
UNION ALL
SELECT 
  'Registros migrados a users' as descripcion,
  COUNT(*) as cantidad
FROM public.users;

-- Mostrar registros que no pudieron migrarse por duplicados
SELECT 
  uo.id,
  uo.email,
  uo.first_name,
  uo.last_name,
  'Email ya existe en users' as razon
FROM public.users_old uo
WHERE EXISTS (
  SELECT 1 
  FROM public.users u 
  WHERE LOWER(TRIM(u.correo)) = LOWER(TRIM(uo.email))
)
UNION ALL
SELECT 
  uo.id,
  uo.email,
  uo.first_name,
  uo.last_name,
  'Sin datos suficientes (email o nombre)' as razon
FROM public.users_old uo
WHERE 
  NULLIF(TRIM(uo.email), '') IS NULL 
  AND NULLIF(TRIM(uo.first_name), '') IS NULL;

