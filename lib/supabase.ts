import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas"
  );
}

// Crear un cliente de Supabase con mejor persistencia
// Si estamos en el servidor y hay service key, usarla para evitar problemas de RLS
const isServer = typeof window === "undefined";
const shouldUseServiceKey = isServer && supabaseServiceKey;

export const supabase = createClient(
  supabaseUrl, 
  shouldUseServiceKey ? supabaseServiceKey : supabaseAnonKey, 
  {
    auth: {
      persistSession: !isServer,
      storageKey: "supabase-auth",
      storage: !isServer ? {
        getItem: (key: string) => {
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
        },
      } : undefined,
    },
  }
);

// Función para crear un cliente con autenticación personalizada
export const createSupabaseClient = (accessToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};
