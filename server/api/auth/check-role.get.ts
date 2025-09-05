import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) return { role: null }

  const client = await serverSupabaseClient(event)
  // Intentar mapear por correo -> campo 'email'
  const { data, error } = await client
    .from('users')
    .select('role, email')
    .eq('email', user.email)
    .maybeSingle()

  if (error) return { role: null, error: error.message }
  return { role: data?.role ?? null }
})
