# Sistema de Registro de Miembros con Supabase

Este proyecto es un sistema de registro y gestión de miembros de una organización, implementado con Next.js y Supabase para la autenticación y base de datos.

## Configuración

1. Clona este repositorio

2. Instala las dependencias:

```bash
npm install
# o
yarn
# o
pnpm install
```

3. Configura las variables de entorno:
   Crea un archivo `.env.local` con la siguiente estructura:

```
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
```

4. Configura Supabase:

   - Crea un proyecto en [Supabase](https://app.supabase.io)
   - Sigue las instrucciones en [docs/supabase-config.md](docs/supabase-config.md)

5. Inicia el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## Características

- Autenticación con correo electrónico y contraseña
- Registro de nuevos miembros con los siguientes datos:
  - Cédula
  - Nombres y apellidos
  - Teléfono y dirección
  - Correo electrónico
  - Opción para indicar si está bautizado y su fecha de bautizo
  - Opción para indicar si tiene WhatsApp

## Estructura del proyecto

- `app/` - Páginas y rutas de la aplicación (Next.js App Router)
- `components/` - Componentes reutilizables
- `hooks/` - Hooks personalizados, incluido el hook de autenticación
- `lib/` - Utilidades y configuración (autenticación, Supabase, etc.)

## Tecnologías utilizadas

- [Next.js](https://nextjs.org/) - Framework de React
- [Supabase](https://supabase.io/) - Backend as a Service
- [React Hook Form](https://react-hook-form.com/) - Manejo de formularios
- [Zod](https://github.com/colinhacks/zod) - Validación de datos
- [Tailwind CSS](https://tailwindcss.com/) - Estilos
- [shadcn/ui](https://ui.shadcn.com/) - Componentes de UI
