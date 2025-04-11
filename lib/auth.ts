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
      console.error("Error de autenticación:", authError);

      // Verificar si es un error de usuario ya existente
      if (
        authError.status === 422 &&
        authError.code === "user_already_exists"
      ) {
        // El usuario existe en Auth pero no en la tabla users, intentamos insertar solo en la tabla
        const { data: userData, error: userError } = await supabase
          .from("users")
          .insert([
            {
              cedula: data.cedula,
              nombres: data.nombres,
              apellidos: data.apellidos,
              telefono: data.telefono,
              direccion: data.direccion,
              correo: data.correo,
              fecha_bautizo: data.fechaBautizo || null,
              whatsapp: data.whatsapp,
              password_hash: hashedPassword,
            },
          ])
          .select("id, correo");

        console.log("userData", userData);
        console.log("userError", userError);

        if (userError && (userError.message || userError.code)) {
          console.error("Error al registrar usuario existente:", userError);
          if (userError.code === "23505") {
            if (userError.message.includes("users_cedula_key")) {
              return { error: "Esta cédula ya está registrada en el sistema" };
            }
            if (userError.message.includes("users_correo_key")) {
              return {
                error:
                  "Este correo electrónico ya está registrado en el sistema",
              };
            }
          }
          return { error: "Error al registrar el usuario" };
        }

        // Si llegamos aquí, significa que añadimos correctamente el usuario a la tabla users
        return {
          success: true,
          user: userData?.[0] || { id: "auth-only", correo: data.correo },
        };
      }

      if (authError.message && authError.message.includes("email")) {
        return { error: "El correo electrónico ya está registrado" };
      }
      return { error: "Error en la autenticación" };
    }

    // Insertar datos del usuario en la tabla users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([
        {
          cedula: data.cedula,
          nombres: data.nombres,
          apellidos: data.apellidos,
          telefono: data.telefono,
          direccion: data.direccion,
          correo: data.correo,
          fecha_bautizo: data.fechaBautizo || null,
          whatsapp: data.whatsapp,
          password_hash: hashedPassword,
        },
      ])
      .select("id, correo");

    // Solo considerar el error si realmente hay un mensaje o código de error
    if (userError && (userError.message || userError.code)) {
      console.error("Error al registrar usuario:", userError);
      if (userError.code === "23505") {
        if (userError.message.includes("users_cedula_key")) {
          return { error: "Esta cédula ya está registrada en el sistema" };
        }
        if (userError.message.includes("users_correo_key")) {
          return {
            error: "Este correo electrónico ya está registrado en el sistema",
          };
        }
      }
      return { error: "Error al registrar el usuario" };
    }

    return { success: true, user: userData?.[0] || authData.user };
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
            cedula: data.user?.user_metadata?.cedula || "Sin cédula",
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
          },
        ]);

        if (insertError) {
          console.error("Error al crear el registro de usuario:", insertError);
          return { error: "No se pudo recuperar la información del usuario" };
        }

        console.log("data", data);
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

    console.log("userData", userData);
    console.log("data", data);

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
