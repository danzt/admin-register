import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  try {
    const client = await serverSupabaseClient(event)

    const { count: totalUsers, error: totalUsersError } = await client
      .from('users')
      .select('*', { count: 'exact', head: true })
    if (totalUsersError) {
      setResponseStatus(event, 500)
      return {
        error: 'Error fetching total users',
        details: totalUsersError.message,
      }
    }

    const today = new Date()
    const firstDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ).toISOString()
    const lastDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).toISOString()

    const { count: newUsersThisMonth, error: newUsersError } = await client
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDay)
      .lte('created_at', lastDay)
    if (newUsersError) {
      setResponseStatus(event, 500)
      return {
        error: 'Error fetching new users this month',
        details: newUsersError.message,
      }
    }

    const activeUsers = totalUsers ?? 0
    const inactiveUsers = 0

    return {
      totalUsers: totalUsers ?? 0,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth: newUsersThisMonth ?? 0,
    }
  } catch (e: any) {
    setResponseStatus(event, 500)
    return { error: 'Internal server error', details: e?.message || e }
  }
})
