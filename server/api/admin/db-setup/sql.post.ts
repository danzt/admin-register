// import { createClient } from '@supabase/supabase-js'
import { pool } from '../../../utils/db'

export default defineEventHandler(async event => {
  const url = getRequestURL(event)
  const key = url.searchParams.get('key')
  if (key !== 'special_setup_key') {
    setResponseStatus(event, 401)
    return { error: 'Acceso no autorizado' }
  }
  try {
    const { sql, email } = await readBody<{ sql: string; email?: string }>(
      event
    )
    if (!sql) {
      setResponseStatus(event, 400)
      return { error: 'Se requiere SQL' }
    }

    // Ejecutar SQL directamente con pool
    try {
      await pool.query(sql)
    } catch (e: any) {
      setResponseStatus(event, 500)
      return { error: 'Error ejecutando SQL', details: e?.message || e }
    }

    if (email) {
      // Actualizar rol usando cliente con sesión
      const client = await serverSupabaseClient(event)
      const { error: updateError } = await client
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email)
      if (updateError) {
        setResponseStatus(event, 500)
        return {
          error: 'SQL ejecutado pero error al actualizar usuario',
          details: updateError,
        }
      }
    }

    return {
      success: true,
      message:
        'SQL ejecutado correctamente' +
        (email ? ` y usuario ${email} actualizado a admin` : ''),
    }
  } catch (e: any) {
    setResponseStatus(event, 500)
    return { error: 'Error de servidor', details: e?.message || e }
  }
})
