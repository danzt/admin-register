import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Role } from "@/hooks/use-auth";

// Crear un cliente de Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Crear un cliente normal de Supabase para verificación de sesión
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

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

    // Verificar la sesión del usuario
    const cookieStore = cookies();
    const supabaseAuthToken = cookieStore.get("supabase-auth")?.value;

    if (!supabaseAuthToken) {
      return NextResponse.json(
        { error: "No autorizado - Sesión no encontrada" },
        { status: 401 }
      );
    }

    // Configurar el cliente con el token de la sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Sesión inválida o expirada" },
        { status: 401 }
      );
    }

    // Obtener el usuario y verificar si es admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('correo', session.user.email)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: "Se requieren permisos de administrador para esta acción" },
        { status: 403 }
      );
    }

    // Ejecutar las actualizaciones usando el cliente admin
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
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ role })
        .eq("id", id);

      if (updateError) {
        console.error("Error actualizando rol:", updateError);
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