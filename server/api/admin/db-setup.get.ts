import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const url = getRequestURL(event)
  const email = url.searchParams.get('email')
  if (!email) {
    setResponseStatus(event, 400)
    return { error: 'Email parameter is required' }
  }
  try {
    const client = await serverSupabaseClient(event)
    const { data: users, error: usersError } = await client
      .from('users')
      .select('*')
      .eq('correo', email)
      .limit(1)
    if (usersError) {
      setResponseStatus(event, 500)
      return {
        error: 'Error al conectar con la base de datos',
        details: usersError,
      }
    }
    if (!users || users.length === 0) {
      setResponseStatus(event, 404)
      return { error: `No se encontró usuario con el correo ${email}` }
    }

    const hasRoleColumn = 'role' in users[0]
    if (!hasRoleColumn) {
      const { error: updateError } = await client
        .from('users')
        .update({ role: 'admin' as any })
        .eq('correo', email)
      if (updateError) {
        return {
          requiresManualUpdate: true,
          message: `La columna 'role' no existe en la tabla 'users'. Ejecuta este SQL:`,
          sqlCommand: `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'usuario';`,
          nextStep: `Después, vuelve a ejecutar esta función para asignar el rol 'admin' a tu usuario.`,
        }
      }
    } else {
      const { error: updateError } = await client
        .from('users')
        .update({ role: 'admin' })
        .eq('correo', email)
      if (updateError) {
        setResponseStatus(event, 500)
        return {
          error: 'Error al actualizar el rol del usuario',
          details: updateError,
        }
      }
      return {
        success: true,
        message: `La configuración se completó. ${email} ahora es administrador.`,
      }
    }
    return {
      success: true,
      message: `La configuración se completó. ${email} ahora es administrador.`,
    }
  } catch (e: any) {
    setResponseStatus(event, 500)
    return {
      error: 'Error en la configuración de la base de datos',
      details: e?.message || e,
    }
  }
})
