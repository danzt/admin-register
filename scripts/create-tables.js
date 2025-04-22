const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Cargar variables de entorno desde .env
require("dotenv").config();

// Obtener URL y clave de Supabase de las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas"
  );
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Método 1: Verificar que la tabla users existe con Supabase JS
async function checkTableExists() {
  try {
    console.log("Verificando si la tabla users existe...");

    // Intentar hacer una consulta a la tabla users
    const { data, error } = await supabase
      .from("users")
      .select("count(*)", { count: "exact", head: true });

    if (error) {
      console.error("Error al verificar la tabla users:", error);
      return false;
    } else {
      console.log("La tabla users existe y está accesible.");
      return true;
    }
  } catch (error) {
    console.error("Error general al verificar la tabla:", error);
    return false;
  }
}

// Método 2: Crear tabla mediante PSQL (Requiere credenciales de base de datos)
function createTablesMethod2() {
  try {
    // Extraer el nombre de la base de datos y host de la URL de Supabase
    const url = new URL(supabaseUrl);
    const host = url.hostname;

    console.log(
      "Para crear las tablas, necesitas ejecutar manualmente el siguiente comando en la terminal:"
    );
    console.log("\n");
    console.log("1. Primero, copia el script SQL a un archivo temporal:");
    console.log(
      `cp ${path.join(
        __dirname,
        "..",
        "docs",
        "crear-tabla-users.sql"
      )} ~/crear-tabla-users.sql`
    );
    console.log("\n");
    console.log(
      "2. Luego, accede al Editor SQL en el dashboard de Supabase y ejecuta el contenido del archivo."
    );
    console.log("   URL: " + supabaseUrl + "/project/sql");
    console.log("\n");
    console.log(
      "3. Alternativamente, si tienes acceso directo a la base de datos, puedes ejecutar:"
    );
    console.log(
      `PGPASSWORD=tu_contraseña psql -h ${host} -U postgres -d postgres -f ~/crear-tabla-users.sql`
    );
    console.log("\n");
    console.log(
      'Nota: Reemplaza "tu_contraseña" con la contraseña de tu base de datos Supabase.'
    );
  } catch (error) {
    console.error("Error al generar instrucciones:", error);
  }
}

// Función principal
async function main() {
  const tableExists = await checkTableExists();

  if (tableExists) {
    console.log("La tabla users ya existe. No es necesario crearla.");
  } else {
    console.log("La tabla users no existe. Se requiere crear la tabla.");
    createTablesMethod2();
  }
}

main().catch(console.error);
