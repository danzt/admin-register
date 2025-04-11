import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Esquema para validar los datos de usuarios
const userSchema = z.object({
  cedula: z.string().min(1, "La cédula es requerida"),
  nombres: z.string().min(1, "El nombre es requerido"),
  apellidos: z.string().min(1, "Los apellidos son requeridos"),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  correo: z.string().email("Correo electrónico inválido").optional().nullable(),
  fechaBautizo: z.string().optional().nullable(),
  whatsapp: z.boolean().default(false),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const importUsersSchema = z.object({
  users: z.array(z.any()), // Aceptamos cualquier dato inicialmente y validamos cada uno por separado
});

export async function POST(request: Request) {
  try {
    // Verificar que el usuario tenga permisos (implementar después si es necesario)

    // Obtener datos de la solicitud
    const body = await request.json();
    const validation = importUsersSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos de usuarios inválidos",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { users } = validation.data;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No hay usuarios para importar" },
        { status: 400 }
      );
    }

    let success = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ cedula: string; error: string }> = [];

    // Procesar cada usuario
    for (const rawUserData of users) {
      try {
        // Validar datos del usuario individualmente
        const userValidation = userSchema.safeParse(rawUserData);

        // Si los datos son inválidos, ignorar este usuario y continuar con el siguiente
        if (!userValidation.success) {
          skipped++;
          const errorMessage =
            userValidation.error.errors[0]?.message || "Datos inválidos";
          errors.push({
            cedula: rawUserData.cedula || "Desconocido",
            error: `Ignorado: ${errorMessage}`,
          });
          continue; // Salta a la siguiente iteración
        }

        const userData = userValidation.data;

        // Verificar si el usuario ya existe en Supabase Auth (por correo)
        let authUserId = null;

        if (userData.correo) {
          try {
            // Buscar si el usuario existe en Auth por correo electrónico
            const {
              data: { users: authUsers },
              error: authListError,
            } = await supabase.auth.admin.listUsers();

            const existingAuthUser = authUsers?.find(
              (u) => u.email === userData.correo
            );

            if (existingAuthUser) {
              authUserId = existingAuthUser.id;
            } else {
              // Si no existe, crear el usuario en Auth
              const hashedPassword = await bcrypt.hash(userData.password, 10);

              const { data: authUser, error: authError } =
                await supabase.auth.admin.createUser({
                  email: userData.correo,
                  password: userData.password,
                  email_confirm: true, // Auto-confirmar el correo
                  user_metadata: {
                    cedula: userData.cedula,
                    nombres: userData.nombres,
                    apellidos: userData.apellidos,
                  },
                });

              if (authError) {
                // Si hay error al crear usuario en auth pero tiene todos los demás datos,
                // continuamos con la creación en la tabla users
                console.warn(
                  `Auth error for ${userData.cedula}: ${authError.message}`
                );
              } else if (authUser?.user) {
                authUserId = authUser.user.id;
              }
            }
          } catch (authErr) {
            // Ignorar errores de autenticación pero registrarlos
            console.warn(`Auth process error for ${userData.cedula}:`, authErr);
          }
        }

        // Verificar si el usuario ya existe en la tabla users (por cédula)
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, cedula")
          .eq("cedula", userData.cedula)
          .single();

        if (existingUser) {
          // Actualizar usuario existente
          const { error: updateError } = await supabase
            .from("users")
            .update({
              nombres: userData.nombres,
              apellidos: userData.apellidos,
              telefono: userData.telefono || null,
              direccion: userData.direccion || null,
              correo: userData.correo || null,
              fecha_bautizo: userData.fechaBautizo || null,
              whatsapp: userData.whatsapp,
            })
            .eq("id", existingUser.id);

          if (updateError) {
            failed++;
            errors.push({
              cedula: userData.cedula,
              error: `Error al actualizar: ${updateError.message}`,
            });
          } else {
            success++;
          }
        } else {
          // Crear nuevo usuario en la tabla users
          const hashedPassword = await bcrypt.hash(userData.password, 10);

          const { error: insertError } = await supabase.from("users").insert([
            {
              cedula: userData.cedula,
              nombres: userData.nombres,
              apellidos: userData.apellidos,
              telefono: userData.telefono || null,
              direccion: userData.direccion || null,
              correo: userData.correo || null,
              fecha_bautizo: userData.fechaBautizo || null,
              whatsapp: userData.whatsapp,
              password_hash: hashedPassword,
            },
          ]);

          if (insertError) {
            failed++;
            errors.push({
              cedula: userData.cedula,
              error: `Error al insertar: ${insertError.message}`,
            });
          } else {
            success++;
          }
        }
      } catch (error: any) {
        failed++;
        errors.push({
          cedula: rawUserData.cedula || "Desconocido",
          error: error.message || "Error desconocido",
        });
        console.error(
          `Error procesando usuario ${rawUserData.cedula || "desconocido"}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success,
      failed,
      skipped,
      total: users.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error en la importación de usuarios:", error);
    return NextResponse.json(
      {
        error: "Ocurrió un error durante la importación de usuarios",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
