const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno desde .env
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitamos esta clave para acceso a nivel de SQL

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas"
  );
  process.exit(1);
}

// Leer el archivo SQL
const sqlFilePath = path.join(__dirname, "..", "docs", "crear-tabla-users.sql");
const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

// Función para crear la tabla Users usando la función de Postgres
async function createTableWithREST() {
  console.log(
    "Intentando crear tabla users a través de la API REST de Supabase..."
  );

  // Si no tenemos la clave de servicio, intentamos con la anónima (aunque probablemente no funcione)
  const key = serviceRoleKey || supabaseKey;

  try {
    // Intentamos usar la API REST para crear la tabla
    const response = await axios({
      method: "POST",
      url: `${supabaseUrl}/rest/v1/rpc/create_users_table`,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
    });

    console.log("Respuesta:", response.status);
    console.log("Tabla creada correctamente mediante API REST");
    return true;
  } catch (error) {
    if (error.response) {
      console.error(
        "Error en la respuesta:",
        error.response.status,
        error.response.data
      );

      // Si la función no existe, mostramos cómo crearla
      if (
        error.response.data &&
        error.response.data.message &&
        error.response.data.message.includes(
          'function "create_users_table" does not exist'
        )
      ) {
        console.log(
          "\nLa función create_users_table no existe en tu base de datos."
        );
        console.log(
          "Necesitas crear esta función en Supabase SQL Editor primero:"
        );
        console.log("\n-------------- SQL PARA CREAR FUNCIÓN --------------");
        console.log(`
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  -- Habilitar extensión pgcrypto para hash de contraseñas
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  -- Crear tabla de usuarios
  CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula TEXT NOT NULL UNIQUE,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT NOT NULL,
    direccion TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    fecha_bautizo TIMESTAMP,
    whatsapp BOOLEAN DEFAULT FALSE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Configurar políticas de Row Level Security (RLS)
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  
  -- Política para permitir lectura solo a usuarios autenticados sobre sus propios datos
  CREATE POLICY "Usuarios pueden ver su propia información" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'service_role');
  
  -- Política para permitir inserción desde la API de servicio
  CREATE POLICY "Servicio puede insertar usuarios" ON public.users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() IS NOT NULL);
  
  -- Política para permitir actualización solo a usuarios autenticados sobre sus propios datos
  CREATE POLICY "Usuarios pueden actualizar su propia información" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'service_role');
  
  -- Dar permisos anónimos para inserción (necesario para registro)
  GRANT INSERT ON public.users TO anon;
END;
$$ LANGUAGE plpgsql;
        `);
        console.log("--------------------------------------------------");
        console.log(
          "\nDespués de crear la función, ejecuta este script nuevamente."
        );
      }
    } else {
      console.error("Error general:", error.message);
    }
    return false;
  }
}

// Método alternativo: Crear tabla con SQL directo
async function createTableDirectSQL() {
  console.log("Intentando crear tabla directamente con SQL...");

  if (!serviceRoleKey) {
    console.error(
      "Se requiere la variable de entorno SUPABASE_SERVICE_ROLE_KEY para ejecutar SQL directo"
    );
    console.log("\nAgrega esta variable a tu archivo .env:");
    console.log("SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio");
    console.log(
      "\nPuedes obtener esta clave en: Dashboard de Supabase > Project Settings > API"
    );
    return false;
  }

  try {
    const response = await axios({
      method: "POST",
      url: `${supabaseUrl}/rest/v1/sql`,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      data: {
        query: sqlContent,
      },
    });

    console.log("Respuesta:", response.status);
    console.log("SQL ejecutado correctamente");
    return true;
  } catch (error) {
    if (error.response) {
      console.error(
        "Error en la respuesta:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("Error general:", error.message);
    }
    return false;
  }
}

// Función principal
async function main() {
  let success = false;

  // Primero intentamos con la API REST
  success = await createTableWithREST();

  // Si no funciona y tenemos la clave de servicio, intentamos con SQL directo
  if (!success && serviceRoleKey) {
    success = await createTableDirectSQL();
  }

  // Si nada funciona, mostramos instrucciones manuales
  if (!success) {
    console.log(
      "\nNo se pudo crear la tabla automáticamente. Por favor, usa el método manual:"
    );
    console.log(
      "1. Ejecuta el script que genera un archivo HTML con las instrucciones:"
    );
    console.log("   node scripts/sql-helper.js");
    console.log(
      "2. Sigue las instrucciones en el navegador para crear la tabla manualmente."
    );
  }
}

// Ejecutar la función principal
main().catch(console.error);
