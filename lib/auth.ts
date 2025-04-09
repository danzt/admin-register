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
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.correo,
      password: data.password,
    });

    if (authError) {
      console.error("Error de autenticación:", authError);
      if (authError.message.includes("email")) {
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

    if (userError) {
      console.error("Error al registrar usuario:", userError);
      if (userError.code === "23505") {
        if (userError.message.includes("users_cedula_key")) {
          return { error: "Cédula already exists" };
        }
        if (userError.message.includes("users_correo_key")) {
          return { error: "Email already exists" };
        }
      }
      return { error: "An error occurred during registration" };
    }

    return { success: true, user: userData[0] };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "An error occurred during registration" };
  }
}

export async function login({ email, password }: z.infer<typeof loginSchema>) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: "Credenciales inválidas" };
    }

    // Obtener información adicional del usuario
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("correo", email)
      .single();

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
