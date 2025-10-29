import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  cedula: z.string().min(1, "Cédula is required"),
  nombres: z.string().min(1, "Nombres is required"),
  apellidos: z.string().min(1, "Apellidos is required"),
  telefono: z.string().min(1, "Teléfono is required"),
  direccion: z.string().min(1, "Dirección is required"),
  correo: z.string().email("Invalid email address"),
  fechaBautizo: z.string().optional(),
  whatsapp: z.boolean().default(false),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function register(data: z.infer<typeof registerSchema>) {
  // Asegúrate de que esta función solo se ejecute en el servidor
  if (typeof window !== "undefined") {
    throw new Error("Esta función solo debe ejecutarse en el servidor");
  }

  try {
    // Primero verificamos si el usuario ya existe en Supabase Auth
    const { data: existingUser } = await supabase
      .from("users")
      .select("correo")
      .eq("correo", data.correo)
      .single();

    if (existingUser) {
      return { error: "El correo electrónico ya está registrado" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Intentar registrar el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.correo,
      password: data.password,
      options: {
        // No redirigir a ninguna página después de verificar el correo
        emailRedirectTo: undefined,
        // Datos adicionales del usuario
        data: {
          cedula: data.cedula,
          nombres: data.nombres,
          apellidos: data.apellidos,
        },
      },
    });

    if (authError) {
      console.error("=== AUTH ERROR ===");
      console.error("Error de autenticación:", authError);
      console.error("Error details:", {
        message: authError.message,
        status: authError.status,
        code: authError.code
      });

      if (authError.message && authError.message.includes("email")) {
        return { error: "El correo electrónico ya está registrado" };
      }
      return { error: "Error en la autenticación" };
    }

    // El trigger de Supabase Auth ya insertó el usuario en la tabla users
    // Solo necesitamos obtenerlo y actualizar los campos adicionales
    await new Promise(resolve => setTimeout(resolve, 500)); // Esperar un momento para que el trigger se complete

    // Obtener el usuario recién creado
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("correo", data.correo)
      .single();

    if (userError) {
      console.error("Error al obtener usuario después de registro:", userError);
      // Si no existe, intentar crearlo manualmente
      const { data: newUserData, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user?.id,
            cedula: data.cedula,
            nombres: data.nombres,
            apellidos: data.apellidos,
            telefono: data.telefono,
            direccion: data.direccion,
            correo: data.correo,
            fecha_bautizo: data.fechaBautizo || null,
            whatsapp: data.whatsapp || false,
            password_hash: hashedPassword,
          },
        ])
        .select("*");

      if (insertError) {
        console.error("Error al insertar usuario manualmente:", insertError);
        return { error: "Error al crear el usuario en la base de datos" };
      }

      return { success: true, user: newUserData?.[0] || authData.user };
    }

    // Actualizar los campos adicionales del usuario si el trigger lo creó con valores por defecto
    if (userData && (userData.nombres === 'Sin nombre' || userData.telefono === 'Sin teléfono')) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          cedula: data.cedula,
          nombres: data.nombres,
          apellidos: data.apellidos,
          telefono: data.telefono,
          direccion: data.direccion,
          fecha_bautizo: data.fechaBautizo || null,
          whatsapp: data.whatsapp || false,
        })
        .eq("id", authData.user?.id);

      if (updateError) {
        console.error("Error al actualizar usuario:", updateError);
      }

      // Obtener el usuario actualizado
      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user?.id)
        .single();

      return { success: true, user: updatedUser || userData };
    }

    return { success: true, user: userData || authData.user };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "Ocurrió un error durante el registro" };
  }
}

export async function login({ email, password }: z.infer<typeof loginSchema>) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Si el error es de verificación de correo, proporcionar un mensaje más claro
      if (error.message.includes("Email not confirmed")) {
        return {
          error:
            "El correo electrónico no ha sido confirmado. Por favor, revisa tu bandeja de entrada.",
        };
      }
      return { error: "Credenciales inválidas" };
    }

    // Obtener información adicional del usuario
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("*")
      .eq("correo", email)
      .single();

    // Si hay un error al obtener datos del usuario pero la autenticación fue exitosa,
    // aún podemos retornar datos básicos del usuario
    if (userDataError && !userData) {
      console.error("Error al obtener datos del usuario:", userDataError);

      // Si es un error de no encontrado, es posible que el usuario exista en Auth pero no en la tabla users
      if (userDataError.code === "PGRST116") {
        // Intentar crear el registro del usuario en la tabla users
        const { error: insertError } = await supabase.from("users").insert([
          {
            id: data.user?.id, // Usar el ID de Auth
            cedula: data.user?.user_metadata?.cedula || "SIN_CEDULA_" + data.user?.id.substring(0, 8),
            nombres:
              data.user?.user_metadata?.nombres ||
              data.user?.email?.split("@")[0] ||
              "Usuario",
            apellidos: data.user?.user_metadata?.apellidos || "",
            telefono: "Sin teléfono",
            direccion: "Sin dirección",
            correo: email,
            whatsapp: false,
            password_hash: "cuenta migrada",
            role: 'usuario',
          },
        ]);

        if (insertError) {
          console.error("Error al crear el registro de usuario:", insertError);
          // Si es error de duplicado, intentar obtener el usuario existente
          if (insertError.code === "23505") {
            const { data: existingUser } = await supabase
              .from("users")
              .select("*")
              .eq("correo", email)
              .single();
            
            if (existingUser) {
              return {
                success: true,
                user: {
                  ...existingUser,
                  session: data.session,
                },
              };
            }
          }
          return { error: "No se pudo recuperar la información del usuario" };
        }

        // Retornar datos básicos del usuario de Auth
        return {
          success: true,
          user: {
            id: data.user?.id || "",
            correo: email,
            cedula: data.user?.user_metadata?.cedula || "Sin cédula",
            nombres:
              data.user?.user_metadata?.nombres ||
              data.user?.email?.split("@")[0] ||
              "Usuario",
            apellidos: data.user?.user_metadata?.apellidos || "",
            telefono: "Sin teléfono",
            direccion: "Sin dirección",
            whatsapp: false,
            session: data.session,
          },
        };
      }

      return { error: "No se pudo recuperar la información del usuario" };
    }

    return {
      success: true,
      user: {
        ...userData,
        session: data.session,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Ocurrió un error durante el inicio de sesión" };
  }
}
