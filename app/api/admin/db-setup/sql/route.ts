import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Esta es una ruta especial para ejecutar SQL directamente
// Solo para uso administrativo
export async function POST(request: Request) {
  // Verificar la clave de seguridad para prevenir acceso no autorizado
  // Esta no es una implementación perfecta de seguridad, pero ayuda
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (key !== 'special_setup_key') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 401 });
  }
  
  try {
    // Obtener los datos del cuerpo
    const { sql, email } = await request.json();
    
    if (!sql) {
      return NextResponse.json({ error: 'Se requiere SQL' }, { status: 400 });
    }
    
    // Crear un cliente de Supabase con la clave de servicio
    // Esto permite ejecutar SQL directamente
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
    
    // Ejecutar el SQL directamente
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error ejecutando SQL:', error);
      return NextResponse.json({ error: 'Error ejecutando SQL', details: error }, { status: 500 });
    }
    
    // Si se proporcionó un email, actualizar el usuario a admin
    if (email) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: 'admin' })
        .eq('correo', email);
      
      if (updateError) {
        console.error('Error actualizando usuario:', updateError);
        return NextResponse.json(
          { error: 'SQL ejecutado pero error al actualizar usuario', details: updateError },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'SQL ejecutado correctamente' + (email ? ` y usuario ${email} actualizado a admin` : '')
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error de servidor', details: error }, { status: 500 });
  }
} 