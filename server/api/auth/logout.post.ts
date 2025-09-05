import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const client = await serverSupabaseClient(event)
  await client.auth.signOut()
  return { ok: true }
})
