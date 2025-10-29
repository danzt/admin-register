import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  cedula: z.string().min(1, "La cédula es obligatoria"),
  nombres: z.string().min(1, "Los nombres son obligatorios"),
  apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  correo: z
    .string()
    .email("El correo electrónico no es válido")
    .nullable()
    .optional(),
  fecha_bautizo: z.string().nullable().optional(),
  whatsapp: z.boolean().default(false),
  bautizado: z.boolean().default(false),
});

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener usuarios:", error);
      return NextResponse.json(
        { error: "Error al obtener usuarios", details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar los datos recibidos
    const validationResult = userSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const userData = validationResult.data;

    // Verificar si ya existe un usuario con la misma cédula
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("cedula", userData.cedula)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con esta cédula" },
        { status: 400 }
      );
    }

    // Crear una contraseña temporal
    const temporalPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(temporalPassword, 10);

    // Crear el usuario en Auth si tiene correo electrónico
    let authUserId = null;
    if (userData.correo) {
      try {
        const { data: authUser, error: authError } =
          await supabase.auth.admin.createUser({
            email: userData.correo,
            password: temporalPassword,
            email_confirm: true,
            user_metadata: {
              cedula: userData.cedula,
              nombres: userData.nombres,
              apellidos: userData.apellidos,
            },
          });

        if (authError) {
          console.warn(`Error al crear usuario en Auth: ${authError.message}`);
        } else if (authUser?.user) {
          authUserId = authUser.user.id;
        }
      } catch (authErr) {
        console.warn("Error en proceso de autenticación:", authErr);
      }
    }

    // Crear el usuario en la tabla users
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          cedula: userData.cedula,
          nombres: userData.nombres,
          apellidos: userData.apellidos,
          telefono: userData.telefono || "Sin teléfono",
          direccion: userData.direccion || "Sin dirección",
          correo: userData.correo || null,
          fecha_bautizo: userData.fecha_bautizo || null,
          whatsapp: userData.whatsapp,
          bautizado: userData.bautizado,
          password_hash: hashedPassword,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(
      {
        user: newUser,
        message: "Usuario creado exitosamente",
        temporalPassword: temporalPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}
