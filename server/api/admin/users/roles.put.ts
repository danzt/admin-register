import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
// import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async event => {
  try {
    const body = await readBody<{ users: { id: string; role: string }[] }>(
      event
    )
    if (!body?.users || !Array.isArray(body.users) || body.users.length === 0) {
      setResponseStatus(event, 400)
      return { error: 'No se proporcionaron usuarios para actualizar' }
    }

    const user = await serverSupabaseUser(event)
    if (!user) {
      setResponseStatus(event, 401)
      return { error: 'No autorizado - Sesión no encontrada' }
    }

    const client = await serverSupabaseClient(event)
    const { data: me, error: userError } = await client
      .from('users')
      .select('role')
      .eq('email', user.email)
      .maybeSingle()

    if (userError || !me || me.role !== 'admin') {
      setResponseStatus(event, 403)
      return {
        error: 'Se requieren permisos de administrador para esta acción',
      }
    }

    const results: any[] = []
    for (const u of body.users) {
      const { id, role } = u
      if (!id || !role) {
        results.push({ id, success: false, message: 'Datos incompletos' })
        continue
      }
      if (!['admin', 'staff', 'usuario'].includes(role)) {
        results.push({ id, success: false, message: 'Rol inválido' })
        continue
      }
      const { error: updateError } = await client
        .from('users')
        .update({ role })
        .eq('id', id)
      if (updateError) {
        results.push({ id, success: false, message: updateError.message })
      } else {
        results.push({ id, success: true })
      }
    }

    const allSuccess = results.every(r => r.success)
    setResponseStatus(event, allSuccess ? 200 : 207)
    return { results }
  } catch (error: any) {
    console.error('Error al actualizar roles de usuarios:', error)
    setResponseStatus(event, 500)
    return { error: 'Error interno del servidor: ' + (error.message || '') }
  }
})
