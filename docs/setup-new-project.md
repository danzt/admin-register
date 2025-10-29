# Setup del Proyecto desde Cero

## Requisitos Previos

- Ya tienes un proyecto Supabase creado
- Ya tienes la tabla `users` con datos
- Variables de entorno configuradas en `.env`

## Pasos para Configurar

### 1. Configurar Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key
```

### 2. Ejecutar SQL para Crear Tablas Faltantes

Abre el **SQL Editor** en Supabase y ejecuta el contenido del archivo:
`sql/create-required-tables.sql`

Este script:
- Agrega la columna `role` a la tabla `users` (si no existe)
- Crea la tabla `permissions`
- Crea la tabla `role_permissions`
- Inserta permisos por defecto
- Asigna permisos a los roles
- Configura políticas de seguridad (RLS)

### 3. Configurar el Trigger de Auth

Ejecuta también el contenido del archivo:
`sql/fix-supabase-auth-trigger.sql`

Este script crea un trigger que automáticamente inserta usuarios en `public.users` cuando se registran en Supabase Auth.

### 4. Configurar Supabase Auth

1. Ve a **Authentication** > **Providers**
2. Asegúrate de que **Email** esté habilitado
3. En configuración de Email, **desactiva** "Confirm email" (para desarrollo)
4. Guarda los cambios

### 5. Crear un Usuario Administrador

Después de ejecutar los scripts SQL, puedes asignar el rol de admin a un usuario existente:

```sql
-- Actualizar un usuario existente a admin (reemplaza con el correo real)
UPDATE users 
SET role = 'admin' 
WHERE correo = 'tu_email@example.com';
```

### 6. Verificar que Todo Funciona

1. Intenta hacer login con un usuario existente
2. Intenta registrar un nuevo usuario
3. Verifica que los permisos funcionen correctamente

## Tablas Creadas

### users
- Ya existente con tus datos
- Ahora incluye la columna `role` (admin, staff, usuario)

### permissions
- Almacena permisos del sistema
- Incluye: view_dashboard, manage_users, view_users, manage_roles, import_users, view_stats

### role_permissions
- Relaciona roles con permisos
- Define qué permisos tiene cada rol

## Roles del Sistema

### admin
- Todos los permisos
- Puede gestionar usuarios, roles y permisos
- Acceso completo al sistema

### staff
- Ver dashboard
- Ver lista de usuarios
- Ver estadísticas

### usuario
- Solo ver su propio dashboard
- Permisos básicos

## Migración de Datos (Opcional)

Si necesitas migrar datos de `users_old` a `users`, ejecuta:
`sql/migrate-users-old-to-users.sql`

Sigue las instrucciones en:
`docs/migracion-users-instructions.md`

## Troubleshooting

### Error: "column role does not exist"
- Asegúrate de ejecutar `sql/create-required-tables.sql` completo

### Error: "duplicate key value violates unique constraint"
- El trigger de Auth ya está creando usuarios automáticamente
- El código ya está actualizado para manejar esto

### Error de autenticación
- Verifica que las variables de entorno estén correctas
- Asegúrate de desactivar la confirmación de email en Auth

## Próximos Pasos

1. Configurar dominio y URL de producción
2. Configurar políticas de RLS más estrictas si es necesario
3. Agregar más permisos según necesidades del proyecto
4. Configurar backups automáticos

