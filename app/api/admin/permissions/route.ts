import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: permissions, error } = await supabase
      .from("permissions")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error al obtener permisos:", error);
      return NextResponse.json(
        { error: "Error al cargar los permisos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ permissions });
  } catch (error: any) {
    console.error("Error en API de permisos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 