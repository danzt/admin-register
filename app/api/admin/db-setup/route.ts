import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Get email parameter from the request
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // 1. Comprobamos si podemos conectarnos a la base de datos
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('correo', email)
      .limit(1);

    if (usersError) {
      console.error('Error checking database connection:', usersError);
      return NextResponse.json(
        { error: 'Error al conectar con la base de datos', details: usersError },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: `No se encontró usuario con el correo ${email}` },
        { status: 404 }
      );
    }

    // 2. Verificamos si la columna 'role' ya existe
    const hasRoleColumn = 'role' in users[0];
    
    // 3. Si la columna no existe, intentamos actualizarla de todos modos
    // Esto generará un error, pero nos permite detectar el problema
    if (!hasRoleColumn) {
      console.log('La columna role no existe. Intentando actualizar para verificar errores...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('correo', email);
      
      if (updateError) {
        console.error('Error esperado al actualizar role:', updateError);
        
        // Retornamos una respuesta JSON con instrucciones específicas para el usuario
        return NextResponse.json({
          requiresManualUpdate: true,
          message: `La columna 'role' no existe en la tabla 'users'. Por favor, ejecuta el siguiente comando SQL en tu base de datos:`,
          sqlCommand: `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'usuario';`,
          nextStep: `Después, vuelve a ejecutar esta función para asignar el rol 'admin' a tu usuario.`
        });
      }
    } else {
      // 4. Si la columna existe, actualizamos el rol a 'admin'
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('correo', email);

      if (updateError) {
        console.error('Error al actualizar el rol del usuario:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar el rol del usuario', details: updateError },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `La configuración se completó con éxito. El usuario ${email} ahora es administrador.`
      });
    }

    return NextResponse.json({
      success: true,
      message: `La configuración se completó con éxito. El usuario ${email} ahora es administrador.`
    });
  } catch (error) {
    console.error('Error en la configuración de la base de datos:', error);
    return NextResponse.json(
      { error: 'Error en la configuración de la base de datos', details: error },
      { status: 500 }
    );
  }
} 