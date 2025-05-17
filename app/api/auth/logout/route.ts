import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // Cerrar la sesión en Supabase
    await supabase.auth.signOut();

    // Crear una respuesta y eliminar la cookie
    const response = NextResponse.json({ success: true });

    // Eliminar la cookie de autenticación
    response.cookies.delete("supabase-auth");

    // Eliminar la cookie del rol
    response.cookies.delete("user-role");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al cerrar sesión" },
      { status: 500 }
    );
  }
}
