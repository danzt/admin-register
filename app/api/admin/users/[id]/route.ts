import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const userUpdateSchema = z.object({
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
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();

    // Validar los datos recibidos
    const validationResult = userUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const userData = validationResult.data;

    // Verificar si el usuario existe
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, cedula, correo")
      .eq("id", id)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }
      throw checkError;
    }

    // Verificar si la cédula ya está en uso por otro usuario
    if (existingUser.cedula !== userData.cedula) {
      const { data: cedulaCheck, error: cedulaError } = await supabase
        .from("users")
        .select("id")
        .eq("cedula", userData.cedula)
        .single();

      if (!cedulaError && cedulaCheck) {
        return NextResponse.json(
          { error: "La cédula ya está en uso por otro usuario" },
          { status: 400 }
        );
      }
    }

    // Actualizar información de autenticación si el email cambió
    if (userData.correo && existingUser.correo !== userData.correo) {
      try {
        // Buscar usuario por correo actual en Auth
        const {
          data: { users: authUsers },
          error: authListError,
        } = await supabase.auth.admin.listUsers();

        const authUser = authUsers?.find(
          (user) => user.email === existingUser.correo
        );

        if (authUser) {
          // Actualizar el correo en Auth
          const { error: updateAuthError } =
            await supabase.auth.admin.updateUserById(authUser.id, {
              email: userData.correo,
            });

          if (updateAuthError) {
            console.warn(
              `Error al actualizar email en Auth: ${updateAuthError.message}`
            );
          }
        }
      } catch (authErr) {
        console.warn(
          "Error en proceso de actualización de autenticación:",
          authErr
        );
      }
    }

    // Actualizar el usuario en la base de datos
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        cedula: userData.cedula,
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        telefono: userData.telefono || "Sin teléfono",
        direccion: userData.direccion || "Sin dirección",
        correo: userData.correo,
        fecha_bautizo: userData.fecha_bautizo,
        whatsapp: userData.whatsapp,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      user: updatedUser,
      message: "Usuario actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}
