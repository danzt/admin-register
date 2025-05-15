import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Esta es una ruta especial de inicialización para crear la función exec_sql
// Solo para uso administrativo durante la configuración inicial
export async function POST(request: Request) {
  try {
    // Verificar la clave de seguridad para prevenir acceso no autorizado
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key !== 'special_setup_key') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 401 });
    }
    
    // SQL para crear la función exec_sql
    const sql = `
    -- This function allows executing arbitrary SQL from the application
    -- Note: This function requires admin privileges to execute
    -- It should be used with caution and only available to admin users

    -- Create the exec_sql function
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER -- Run with privileges of the function creator
    SET search_path = public
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN json_build_object('success', true);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object(
          'success', false,
          'error', SQLERRM,
          'code', SQLSTATE
        );
    END;
    $$;

    -- Set ownership to postgres (or your preferred role with appropriate permissions)
    ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;

    -- Grant execute permission only to authenticated users
    -- Row-level security in application code will handle authorization
    REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

    -- Add comment documenting the function purpose and security implications
    COMMENT ON FUNCTION public.exec_sql(text) IS 
    'Executes arbitrary SQL. This function has security implications and should only be callable by authenticated users with admin privileges. Application code must implement proper authorization checks.';
    `;
    
    // Crear un cliente de Supabase con la clave de servicio
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Ejecutar SQL directamente con la clave de servicio
    // Usamos el endpoint SQL de Supabase con el método POST
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuración de Supabase no disponible' },
        { status: 500 }
      );
    }
    
    // Ejecutar SQL directamente con la API REST de PostgreSQL de Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    // Manejar respuesta y posibles errores
    if (!response.ok) {
      let errorMsg = 'Error ejecutando SQL para crear exec_sql';
      try {
        const errorData = await response.json();
        errorMsg = `${errorMsg}: ${JSON.stringify(errorData)}`;
      } catch (e) {
        // Si no podemos parsear el error, usar el mensaje genérico
      }
      
      console.error(errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Función exec_sql creada exitosamente'
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: `Error en el servidor: ${error.message}` },
      { status: 500 }
    );
  }
} 