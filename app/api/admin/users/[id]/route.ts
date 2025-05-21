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
  bautizado: z.boolean().default(false),
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
        bautizado: userData.bautizado,
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Primero, obtener el email del usuario para poder eliminarlo de Supabase Auth
    const { data: userToDelete, error: fetchError } = await supabase
      .from("users")
      .select("id, correo") // Seleccionar el correo para la eliminación en Auth
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { message: "Usuario no encontrado para eliminar" },
          { status: 404 }
        );
      }
      console.error("Error al buscar usuario para eliminar:", fetchError);
      return NextResponse.json(
        { message: "Error al buscar el usuario", error: fetchError.message },
        { status: 500 }
      );
    }

    // Eliminar el usuario de la tabla 'users'
    const { error: deleteDbError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteDbError) {
      console.error("Error al eliminar usuario de la base de datos:", deleteDbError);
      return NextResponse.json(
        { message: "Error al eliminar el usuario de la base de datos", error: deleteDbError.message },
        { status: 500 }
      );
    }

    // Intentar eliminar el usuario de Supabase Auth si tiene correo
    if (userToDelete && userToDelete.correo) {
      try {
        // Es necesario encontrar el auth_user_id basado en el email, ya que el 'id' de la tabla 'users' no es el mismo que el de 'auth.users'
        const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.warn("Error al listar usuarios de Auth para eliminación:", listError.message);
          // Continuar incluso si no se puede listar, la eliminación de DB ya fue exitosa
        }
        
        const authUser = authUsers?.find(user => user.email === userToDelete.correo);

        if (authUser) {
          const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUser.id);
          if (deleteAuthError) {
            // Loggear pero no fallar la respuesta completa, ya que el usuario de la BD fue eliminado
            console.warn("Error al eliminar usuario de Supabase Auth:", deleteAuthError.message);
            // Podrías retornar un mensaje específico si la eliminación de Auth falla pero la de DB tiene éxito
            return NextResponse.json({
              message: "Usuario eliminado de la base de datos, pero falló la eliminación de la cuenta de autenticación. Por favor, revise manualmente.",
            });
          }
        } else {
          console.warn(`No se encontró usuario en Supabase Auth con correo: ${userToDelete.correo} para eliminar.`);
        }
      } catch (authError: any) {
        console.warn("Error durante el proceso de eliminación de Supabase Auth:", authError.message);
      }
    }

    return NextResponse.json({ message: "Usuario eliminado exitosamente" });

  } catch (error: any) {
    console.error("Error general al eliminar usuario:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al eliminar el usuario", error: error.message },
      { status: 500 }
    );
  }
}
