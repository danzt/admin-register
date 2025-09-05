import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  try {
    const body = await readBody<{ sql: string }>(event)
    const { sql } = body || {}
    if (!sql) {
      setResponseStatus(event, 400)
      return { error: 'Se requiere SQL' }
    }

    const user = await serverSupabaseUser(event)
    if (!user) {
      setResponseStatus(event, 401)
      return { error: 'No autenticado' }
    }

    const client = await serverSupabaseClient(event)
    const { data: me } = await client
      .from('users')
      .select('role')
      .eq('correo', user.email)
      .maybeSingle()
    if (!me || me.role !== 'admin') {
      setResponseStatus(event, 403)
      return {
        error: 'Se requieren permisos de administrador para ejecutar SQL',
      }
    }

    const { data, error } = await client.rpc('exec_sql', { sql })
    if (error) {
      setResponseStatus(event, 500)
      return { error: `Error ejecutando SQL: ${error.message}` }
    }

    return { success: true, message: 'SQL ejecutado con éxito', data }
  } catch (error: any) {
    setResponseStatus(event, 500)
    return { error: `Error en el servidor: ${error.message}` }
  }
})
