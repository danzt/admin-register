# Instrucciones para Migrar Datos de users_old a users

## Descripción

Este proceso migra todos los datos de la tabla `users_old` (con campos en inglés) a la tabla `users` (con campos en español), mapeando los campos correctamente.

## Campos Mapeados

| users_old (Inglés) | users (Español) | Notas |
|-------------------|-----------------|-------|
| `id` | `id` | Se mantiene el mismo UUID |
| `id_number` | `cedula` | Si está vacío, se genera un valor temporal |
| `first_name` | `nombres` | Si está vacío, se usa "Sin nombre" |
| `last_name` | `apellidos` | Si está vacío, se usa "Sin apellido" |
| `phone` | `telefono` | Si está vacío, se usa "Sin teléfono" |
| `address` | `direccion` | Si está vacío, se usa "Sin dirección" |
| `email` | `correo` | Campo obligatorio |
| `baptism_date` | `fecha_bautizo` | Se mapea desde baptism_date |
| `whatsapp` | `whatsapp` | Se mantiene igual |
| - | `password_hash` | Se genera un hash temporal |
| `created_at` | `created_at` | Se mantiene |
| `updated_at` | `updated_at` | Se mantiene |

## Pasos para Ejecutar la Migración

### 1. Hacer Backup

```sql
-- Crear tabla de respaldo
CREATE TABLE public.users_backup AS SELECT * FROM public.users;
```

### 2. Revisar Datos a Migrar

```sql
-- Ver cuántos registros se van a migrar
SELECT COUNT(*) FROM public.users_old;

-- Ver registros que no se podrán migrar
SELECT 
  uo.id,
  uo.email,
  uo.first_name,
  uo.last_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users u 
      WHERE LOWER(TRIM(u.correo)) = LOWER(TRIM(uo.email))
    ) THEN 'Email duplicado'
    WHEN NULLIF(TRIM(uo.email), '') IS NULL AND NULLIF(TRIM(uo.first_name), '') IS NULL THEN 'Sin datos suficientes'
    ELSE 'OK'
  END as estado
FROM public.users_old uo;
```

### 3. Ejecutar la Migración

Abre el editor SQL en Supabase y ejecuta el contenido del archivo:
- `sql/migrate-users-old-to-users.sql`

O copia y pega el siguiente comando:

```sql
-- Ver el script en sql/migrate-users-old-to-users.sql
```

### 4. Verificar Resultados

```sql
-- Contar registros migrados
SELECT COUNT(*) FROM public.users;

-- Ver algunos registros migrados
SELECT id, cedula, nombres, apellidos, correo, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Comparar con users_old
SELECT 
  (SELECT COUNT(*) FROM public.users_old) as en_users_old,
  (SELECT COUNT(*) FROM public.users) as en_users;
```

### 5. (Opcional) Importante sobre Contraseñas

Todos los usuarios migrados tendrán una contraseña temporal. **DEBES**:
1. Notificar a los usuarios que deben cambiar su contraseña
2. O establecer contraseñas específicas

Para asignar una contraseña común a todos los usuarios migrados:

```sql
-- Ejemplo: Establecer contraseña "password123" (CAMBIAR EN PRODUCCIÓN)
UPDATE public.users 
SET password_hash = crypt('password123', gen_salt('bf'))
WHERE password_hash LIKE 'password_temp_change_me_%';
```

## Rollback (Si Necesitas Revertir)

Si algo sale mal, puedes revertir la migración ejecutando:
- `sql/rollback-users-migration.sql`

```sql
-- Eliminar registros migrados
DELETE FROM public.users
WHERE id IN (SELECT id FROM public.users_old);
```

## Problemas Comunes

### Email duplicado
Si un email en `users_old` ya existe en `users`, ese registro NO se migrará para evitar duplicados.

### Datos faltantes
Los campos requeridos que estén vacíos se llenarán con valores por defecto:
- Sin cédula: `SIN_CEDULA_xxxx`
- Sin correo: `sin_correo_xxxx@example.com`
- Sin nombre: `Sin nombre`
- Sin apellido: `Sin apellido`

### Después de la Migración

1. **No elimines `users_old`** inmediatamente - guárdala como respaldo
2. **Verifica** que todos los datos importantes se migraron correctamente
3. **Actualiza las contraseñas** de los usuarios migrados
4. **Prueba** el login con algunos usuarios migrados

