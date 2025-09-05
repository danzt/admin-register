import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  try {
    const client = await serverSupabaseClient(event)
    const { data: permissions, error } = await client
      .from('permissions')
      .select('*')
      .order('name', { ascending: true })
    if (error) {
      setResponseStatus(event, 500)
      return { error: 'Error al cargar los permisos' }
    }
    return { permissions }
  } catch {
    setResponseStatus(event, 500)
    return { error: 'Error interno del servidor' }
  }
})
