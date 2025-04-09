import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "./use-toast";

type User = {
  id: string;
  correo: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  direccion: string;
  whatsapp: boolean;
  fecha_bautizo?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (formData: any) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: async () => {},
  register: async () => ({}),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar si hay una sesión activa al cargar el componente
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Obtener datos del usuario desde la base de datos
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("correo", session.user.email)
          .single();

        if (userData) {
          setUser(userData);
        }
      }

      setLoading(false);
    };

    // Suscribirse a cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Obtener datos del usuario desde la base de datos
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("correo", session.user.email)
          .single();

        if (userData) {
          setUser(userData);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        return { error: result.error };
      }

      if (result.success && result.user) {
        setUser(result.user);
        router.push("/dashboard");
        toast({
          title: "Éxito",
          description: "Inicio de sesión exitoso",
        });
      }

      return {};
    } catch (error) {
      console.error("Error en inicio de sesión:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error durante el inicio de sesión",
      });
      return { error: "Ocurrió un error durante el inicio de sesión" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push("/auth/login");
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cerrar sesión",
      });
    }
  };

  const register = async (formData: any) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        return { error: result.error };
      }

      toast({
        title: "Éxito",
        description: "Registro completado exitosamente",
      });
      router.push("/auth/login");

      return {};
    } catch (error) {
      console.error("Error en registro:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error durante el registro",
      });
      return { error: "Ocurrió un error durante el registro" };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
