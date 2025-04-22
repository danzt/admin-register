const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno desde .env
require("dotenv").config();

// Obtener URL y clave de Supabase de las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verifica si las variables de entorno están definidas
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas"
  );
  process.exit(1);
}

// Crear cliente de Supabase con apikey de servicio (no anon key)
const supabase = createClient(supabaseUrl, supabaseKey);

// Leer el contenido del archivo SQL
const sqlFilePath = path.join(__dirname, "..", "docs", "crear-tabla-users.sql");
const sqlScript = fs.readFileSync(sqlFilePath, "utf8");

// Dividir el script SQL en comandos individuales
const sqlCommands = sqlScript
  .split(";")
  .map((cmd) => cmd.trim())
  .filter((cmd) => cmd.length > 0);

// Función para ejecutar SQL directo
async function executeSql() {
  console.log("Ejecutando script SQL para crear tabla users...");
  console.log("Número de comandos a ejecutar:", sqlCommands.length);

  try {
    // Ejecutar el SQL de creación de tabla (extensión pgcrypto y tabla users)
    const { data, error } = await supabase.rpc("sql_query", {
      query: `
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
      `,
    });

    if (error) {
      console.error("Error al crear la tabla:", error);

      // Si el error es porque la función no existe, mostrar solución alternativa
      if (
        error.message &&
        error.message.includes('function "sql_query" does not exist')
      ) {
        console.log(
          "\nNo se pudo ejecutar SQL directo. Necesitas configurar la función sql_query en Supabase."
        );
        console.log(
          "\nAlternativa: Usa el método del archivo HTML para crear la tabla:"
        );
        console.log("node scripts/sql-helper.js");
        return;
      }
    } else {
      console.log("Tabla creada correctamente.");
    }

    // Configurar políticas de RLS en comandos separados para mayor compatibilidad
    const rlsPolicies = [
      `CREATE POLICY "Usuarios pueden ver su propia información" ON public.users
       FOR SELECT USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'service_role');`,

      `CREATE POLICY "Servicio puede insertar usuarios" ON public.users
       FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() IS NOT NULL);`,

      `CREATE POLICY "Usuarios pueden actualizar su propia información" ON public.users
       FOR UPDATE USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'service_role');`,

      `GRANT INSERT ON public.users TO anon;`,
    ];

    // Ejecutar cada política RLS
    for (const policy of rlsPolicies) {
      const { error: policyError } = await supabase.rpc("sql_query", {
        query: policy,
      });
      if (policyError) {
        console.error(
          `Error al crear política: ${policy.substring(0, 30)}...`,
          policyError
        );
      } else {
        console.log(`Política creada: ${policy.substring(0, 30)}...`);
      }
    }

    // Verificar que la tabla existe
    const { data: checkData, error: checkError } = await supabase
      .from("users")
      .select("count(*)", { count: "exact", head: true });

    if (checkError) {
      console.error("Error al verificar la tabla:", checkError);
    } else {
      console.log('Tabla "users" creada y verificada correctamente.');
      console.log("Ahora puedes continuar con el registro de usuarios.");
    }
  } catch (err) {
    console.error("Error general:", err);
    console.log(
      "\nAlternativa: Usa el método del archivo HTML para crear la tabla:"
    );
    console.log("node scripts/sql-helper.js");
  }
}

// Ejecutar la función principal
executeSql();
