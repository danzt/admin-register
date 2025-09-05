import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const client = await serverSupabaseClient(event)
    const { data: users, error } = await client
      .from('users')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
    if (error) {
      setResponseStatus(event, 500)
      return { error: 'Error fetching users data', details: error.message }
    }

    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ]
    const usersByMonth: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`
      usersByMonth[key] = 0
    }
    ;(users || []).forEach((u: any) => {
      if (u.created_at) {
        const d = new Date(u.created_at)
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`
        if (usersByMonth[key] != null) usersByMonth[key]++
      }
    })

    return Object.entries(usersByMonth).map(([name, usuarios]) => ({
      name,
      usuarios,
    }))
  } catch (e: any) {
    setResponseStatus(event, 500)
    return { error: 'Internal server error', details: e?.message || e }
  }
})
