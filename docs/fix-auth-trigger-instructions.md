# Solucionar el Error de Registro con Supabase Auth

## Problema

El registro de usuarios falla con el error:
```
ERROR: column "email" of relation "users" does not exist (SQLSTATE 42703)
```

## Causa

Supabase Auth intenta insertar automáticamente un registro en la tabla `public.users` cuando se crea un usuario en `auth.users`, pero busca una columna llamada `email` que no existe en tu tabla (tu tabla usa `correo`).

## Solución

Ejecuta el script SQL que crea un trigger que mapea `email` a `correo`.

## Pasos

1. Abre el **SQL Editor** en tu proyecto de Supabase
2. Ejecuta el contenido del archivo `sql/fix-supabase-auth-trigger.sql`
3. Verifica que se creó el trigger correctamente

## Qué hace el trigger

Cuando se crea un usuario en `auth.users`:
1. Detecta automáticamente el nuevo usuario
2. Inserta un registro correspondiente en `public.users`
3. Mapea `email` → `correo`
4. Incluye los metadatos adicionales (cedula, nombres, apellidos) desde `user_metadata`

## Después de ejecutar el trigger

Una vez que ejecutes el script, intenta registrar un usuario nuevamente. Debería funcionar correctamente.

## Notas Importantes

- El trigger usa `SECURITY DEFINER` para permitir insertar con los permisos del propietario de la función
- Los valores por defecto se usan para campos que no están disponibles
- El password_hash no se almacena porque Supabase Auth maneja las contraseñas

## Rollback (si necesitas revertir)

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

