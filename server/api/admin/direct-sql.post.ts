import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { pool } from '../../utils/db'

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

    // Intentar con RPC exec_sql primero
    const { data, error } = await client.rpc('exec_sql', { sql })
    if (!error) {
      return { success: true, message: 'SQL ejecutado con éxito', data }
    }
    // Si la función no existe o falla, fallback a ejecutar directo vía pool
    try {
      const res = await pool.query(sql)
      return {
        success: true,
        message: 'SQL ejecutado con éxito (pool)',
        rowCount: res.rowCount,
      }
    } catch (e: any) {
      setResponseStatus(event, 500)
      return { error: `Error ejecutando SQL: ${e?.message || e}` }
    }
  } catch (error: any) {
    setResponseStatus(event, 500)
    return { error: `Error en el servidor: ${error.message}` }
  }
})
