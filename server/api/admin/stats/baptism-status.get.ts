import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  try {
    const client = await serverSupabaseClient(event)
    const { data: users, error } = await client
      .from('users')
      .select('baptism_date')
    if (error) {
      setResponseStatus(event, 500)
      return { error: 'Error fetching users data', details: error.message }
    }

    let baptizedCount = 0
    let notBaptizedCount = 0
    ;(users || []).forEach((u: any) => {
      if (u.baptism_date) baptizedCount++
      else notBaptizedCount++
    })

    return [
      { name: 'Bautizados', value: baptizedCount },
      { name: 'No Bautizados', value: notBaptizedCount },
    ]
  } catch (e: any) {
    setResponseStatus(event, 500)
    return { error: 'Internal server error', details: e?.message || e }
  }
})
