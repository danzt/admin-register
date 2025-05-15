import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Role } from "@/hooks/use-auth";

export async function PUT(req: NextRequest) {
  try {
    const { users } = await req.json();

    // Verificar datos
    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron usuarios para actualizar" },
        { status: 400 }
      );
    }

    // Obtener el token de autenticación de las cookies
    const cookieStore = cookies();
    const supabaseAuthToken = cookieStore.get("supabase-auth")?.value;
    const userRole = cookieStore.get("user-role")?.value;
    
    if (!supabaseAuthToken) {
      return NextResponse.json(
        { error: "No autorizado - No se encontró token de sesión" },
        { status: 401 }
      );
    }

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Se requieren permisos de administrador para esta acción" },
        { status: 403 }
      );
    }

    // Crear cliente de Supabase con el token de autenticación
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAuthToken}`
        }
      }
    });

    // Ejecutar las actualizaciones
    const results = [];
    for (const user of users) {
      const { id, role } = user;

      if (!id || !role) {
        results.push({ id, success: false, message: "Datos incompletos" });
        continue;
      }

      // Validar rol
      if (!["admin", "staff", "usuario"].includes(role)) {
        results.push({ id, success: false, message: "Rol inválido" });
        continue;
      }

      // Actualizar rol del usuario
      const { error: updateError } = await supabaseClient
        .from("users")
        .update({ role })
        .eq("id", id);

      if (updateError) {
        results.push({ 
          id, 
          success: false, 
          message: updateError.message 
        });
      } else {
        results.push({ id, success: true });
      }
    }

    // Verificar si todas las actualizaciones fueron exitosas
    const allSuccess = results.every(result => result.success);
    const status = allSuccess ? 200 : 207; // 207 Multi-Status

    return NextResponse.json({ results }, { status });

  } catch (error: any) {
    console.error("Error al actualizar roles de usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor: " + error.message },
      { status: 500 }
    );
  }
} 