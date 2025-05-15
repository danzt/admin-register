import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "./use-toast";

export type Role = 'admin' | 'staff' | 'usuario';

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
  role: Role;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (
    email: string,
    password: string,
    redirectTo?: string
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (formData: any) => Promise<{ error?: string }>;
  checkSession: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
  hasPermission: (permission: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: async () => {},
  register: async () => ({}),
  checkSession: async () => {},
  hasRole: () => false,
  hasPermission: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(() => {
    // Intentar cargar el usuario desde localStorage al iniciar
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("authUser");
        if (savedUser) {
          return JSON.parse(savedUser);
        }
      } catch (e) {
        // Error al cargar desde localStorage
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [permissionsCache, setPermissionsCache] = useState<{[key: string]: boolean}>({});
  const router = useRouter();
  const { toast } = useToast();

  // Verificar si el usuario tiene un rol específico
  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = async (permission: string): Promise<boolean> => {
    if (!user) return false;
    
    // Si el usuario es admin, tiene todos los permisos
    if (user.role === 'admin') return true;
    
    // Verificar en el cache primero
    if (permissionsCache.hasOwnProperty(permission)) {
      return permissionsCache[permission];
    }
    
    try {
      // Obtener los permisos del rol del usuario
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permissions(name)')
        .eq('role', user.role)
        .eq('permissions.name', permission);
      
      const hasAccess = !error && data && data.length > 0;
      
      // Guardar en cache
      setPermissionsCache(prev => ({
        ...prev,
        [permission]: hasAccess
      }));
      
      return hasAccess;
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  };

  // Función para verificar la sesión actual
  const checkSession = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Si no hay sesión, limpiamos y terminamos rápido
        setUser(null);
        setLoading(false);
        return;
      }

      // Obtener datos del usuario desde la base de datos
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("correo", session.user.email)
        .single();

      if (userData) {
        setUser(userData);
        setLoading(false);
        return;
      }

      // Si no hay datos o hay error, creamos un usuario básico
      setUser({
        id: session.user.id,
        correo: session.user.email || "",
        cedula: session.user.user_metadata?.cedula || "Sin cédula",
        nombres:
          session.user.user_metadata?.nombres ||
          session.user.email?.split("@")[0] ||
          "Usuario",
        apellidos: session.user.user_metadata?.apellidos || "",
        telefono: "Sin teléfono",
        direccion: "Sin dirección",
        whatsapp: false,
        role: 'usuario',
      });
    } catch (error) {
      console.error("Error verificando sesión:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar si hay una sesión activa al cargar el componente
    checkSession();

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
        } else {
          // Ejecutar checkSession para intentar recuperar o crear el usuario
          await checkSession();
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    redirectTo: string = "/dashboard"
  ) => {
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
        setLoading(false);
        return { error: result.error };
      }

      if (result.success && result.user) {
        // Guardar en localStorage para persistencia
        try {
          localStorage.setItem("authUser", JSON.stringify(result.user));

          // Establecer el usuario en el estado
          setUser(result.user);

          // Desactivar el estado de carga ANTES de redireccionar
          setLoading(false);

          // Redirigir al dashboard después de completar todo lo anterior
          router.push(redirectTo);
          return { success: true };
        } catch (e) {
          console.error("Error guardando datos de usuario:", e);
          setLoading(false);
        }
      }

      // Si llegamos aquí, algo falló
      setLoading(false);
      return { error: "Error inesperado al iniciar sesión" };
    } catch (error) {
      console.error("Error inesperado:", error);
      setLoading(false);
      return { error: "Ocurrió un error durante el inicio de sesión" };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Llamar a la API para cerrar sesión y limpiar cookies
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Limpiar datos del usuario
      setUser(null);

      // Limpiar localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("authUser");
      }

      // Mostrar notificación
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });

      // Redirigir al login
      router.push("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cerrar sesión",
      });
    } finally {
      setLoading(false);
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

      if (response.ok && result.success) {
        toast({
          title: "Éxito",
          description: "Registro completado exitosamente",
        });

        // Si el registro fue exitoso pero el usuario ya existía en Auth
        if (result.user && result.user.id === "auth-only") {
          // Intentar iniciar sesión automáticamente
          await supabase.auth.signInWithPassword({
            email: formData.correo,
            password: formData.password,
          });

          // Recargar la sesión
          await checkSession();
        }

        router.push("/auth/login");
        return {};
      }

      if (result.error) {
        let errorMessage = result.error;

        // Si el error es de conflicto (usuario ya existe), mostrar mensaje más claro
        if (response.status === 409) {
          if (
            result.error.includes("correo") ||
            result.error.includes("email")
          ) {
            errorMessage =
              "Este correo electrónico ya está registrado. Por favor utiliza otro o inicia sesión.";
          } else if (result.error.includes("cédula")) {
            errorMessage = "Esta cédula ya está registrada en el sistema.";
          }
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
        return { error: errorMessage };
      }

      // Si llegamos aquí es porque hubo un error no identificado
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error durante el registro",
      });
      return { error: "Ocurrió un error durante el registro" };
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
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        register, 
        checkSession,
        hasRole,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
