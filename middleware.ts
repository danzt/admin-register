import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "./hooks/use-auth";

// Configuración de rutas protegidas por roles
const ROLE_PROTECTED_ROUTES: Record<string, Role[]> = {
  '/dashboard/configuracion': ['admin', 'staff'],
};

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("supabase-auth");
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isHomePage = request.nextUrl.pathname === "/";
  const userRole = request.cookies.get("user-role")?.value as Role | undefined;

  // Redirección desde la página de inicio
  if (isHomePage) {
    if (sessionId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Verificar autenticación
  if (!sessionId && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Redirigir si ya está autenticado y trata de acceder a páginas de auth
  if (sessionId && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Verificar acceso a rutas protegidas por roles
  if (sessionId) {
    const currentPath = request.nextUrl.pathname;

    // Verificar si la ruta actual requiere un rol específico
    for (const [protectedPath, allowedRoles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
      if (currentPath.startsWith(protectedPath)) {
        // Si no hay rol en la cookie o el rol no está permitido
        if (!userRole || !allowedRoles.includes(userRole)) {
          // Redirigir al dashboard con mensaje de acceso denegado
          const url = new URL("/dashboard", request.url);
          url.searchParams.set("access_denied", "true");
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/auth/:path*"],
};
