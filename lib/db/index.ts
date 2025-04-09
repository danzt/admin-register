import { Pool } from "pg";

// Asegúrate de que esto solo se ejecute en el servidor
let pool: Pool;

if (typeof window === "undefined") {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });
} else {
  // Asignación vacía en el cliente para evitar errores
  pool = {} as Pool;
}

export default pool;
