import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Verificar que el usuario esté autenticado y sea admin
    const cookieStore = cookies();
    const supabaseAuthToken = cookieStore.get('supabase-auth')?.value;
    const userRole = cookieStore.get('user-role')?.value;
    
    if (!supabaseAuthToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Se requieren permisos de administrador para ejecutar SQL' },
        { status: 403 }
      );
    }
    
    // Obtener el SQL a ejecutar
    const body = await request.json();
    const { sql } = body;
    
    if (!sql) {
      return NextResponse.json(
        { error: 'Se requiere SQL para ejecutar' },
        { status: 400 }
      );
    }
    
    // Crear cliente de Supabase con el token de autenticación
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración de Supabase no disponible' },
        { status: 500 }
      );
    }
    
    // Si tenemos service key, usar cliente con permisos de servicio
    const supabaseClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      : createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${supabaseAuthToken}`
            }
          }
        });
    
    // Intentar crear la función exec_sql si todavía no existe
    // Esto es un caso especial para el endpoint direct-sql
    try {
      // Primero, ejecutar directamente como SQL
      const { data, error } = await supabaseClient.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('Error ejecutando SQL:', error);
        return NextResponse.json(
          { error: `Error ejecutando SQL: ${error.message}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'SQL ejecutado con éxito',
        data
      });
      
    } catch (e: any) {
      console.error('Error en la ejecución de SQL:', e);
      return NextResponse.json(
        { error: `Error en el servidor: ${e.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error en la ejecución de SQL:', error);
    return NextResponse.json(
      { error: `Error en el servidor: ${error.message}` },
      { status: 500 }
    );
  }
} 