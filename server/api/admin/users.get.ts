import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('users')
    .select('id, id_number, first_names, last_names, email, role, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    setResponseStatus(event, 500)
    return { error: error.message }
  }
  return { users: data }
})
