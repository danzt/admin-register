import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const client = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    setResponseStatus(event, 400)
    return { error: 'Missing id' }
  }
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    setResponseStatus(event, 500)
    return { error: error.message }
  }
  return { user: data }
})
