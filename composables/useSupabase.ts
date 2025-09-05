import { createClient } from '@supabase/supabase-js'

// Cliente personalizado para operaciones de base de datos
export const useSupabaseServiceClient = () => {
  const config = useRuntimeConfig()

  console.log('🔧 useSupabaseServiceClient - Config:', {
    url: config.public.SUPABASE_URL,
    key: config.public.SUPABASE_KEY ? 'Presente' : 'Faltante',
  })

  const client = createClient(
    config.public.SUPABASE_URL,
    config.public.SUPABASE_KEY
  )

  console.log('🔧 useSupabaseServiceClient - Cliente creado:', !!client)

  return client
}

// Composable para operaciones de usuarios
export const useUsers = () => {
  const supabase = useSupabaseServiceClient()

  const getUsers = async () => {
    console.log('🔍 getUsers - Iniciando consulta...')
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('🔍 getUsers - Resultado:', { data: data?.length, error })

      if (error) {
        console.error('❌ getUsers - Error:', error)
        throw error
      }
      return data
    } catch (err) {
      console.error('❌ getUsers - Excepción:', err)
      throw err
    }
  }

  const getUserById = async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  const createUser = async (userData: any) => {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateUser = async (id: string, userData: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id)

    if (error) throw error
  }

  const importUsers = async (users: any[]) => {
    const { data, error } = await supabase.from('users').insert(users).select()

    if (error) throw error
    return data
  }

  return {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    importUsers,
  }
}

// Composable para estadísticas del dashboard
export const useDashboardStats = () => {
  const supabase = useSupabaseServiceClient()

  const getSummaryStats = async () => {
    console.log('📊 getSummaryStats - Iniciando consulta...')
    try {
      const { data: users, error } = await supabase.from('users').select('*')

      console.log('📊 getSummaryStats - Resultado:', {
        users: users?.length,
        error,
      })

      if (error) {
        console.error('❌ getSummaryStats - Error:', error)
        throw error
      }

      const totalUsers = users.length
      const activeUsers = users.filter(u => u.role !== 'inactive').length
      const inactiveUsers = users.filter(u => u.role === 'inactive').length

      // Usuarios nuevos este mes
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const newUsersThisMonth = users.filter(
        u => new Date(u.created_at) >= thisMonth
      ).length

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
      }
    } catch (err) {
      console.error('❌ getSummaryStats - Excepción:', err)
      throw err
    }
  }

  const getUsersByMonth = async () => {
    const { data: users, error } = await supabase
      .from('users')
      .select('created_at')
      .order('created_at', { ascending: true })

    if (error) throw error

    // Agrupar por mes
    const monthlyData: Record<string, number> = {}

    users.forEach(user => {
      const date = new Date(user.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
    })

    // Convertir a formato para el gráfico
    return Object.entries(monthlyData).map(([name, usuarios]) => ({
      name,
      usuarios,
    }))
  }

  const getBaptismStatus = async () => {
    const { data: users, error } = await supabase
      .from('users')
      .select('bautizado')

    if (error) throw error

    const baptized = users.filter(u => !!(u as any).bautizado).length
    const notBaptized = users.length - baptized

    return [
      { name: 'Bautizados', value: baptized },
      { name: 'No bautizados', value: notBaptized },
    ]
  }

  return {
    getSummaryStats,
    getUsersByMonth,
    getBaptismStatus,
  }
}

// Composable para permisos y roles
export const usePermissions = () => {
  const supabase = useSupabaseServiceClient()

  const getPermissions = async () => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  }

  const getRolePermissions = async () => {
    const { data, error } = await supabase.from('role_permissions').select(`
        role,
        permissions (
          id,
          name
        )
      `)

    if (error) throw error

    // Agrupar por rol
    const grouped = data.reduce((acc: any, item: any) => {
      if (!acc[item.role]) {
        acc[item.role] = []
      }
      acc[item.role].push(item.permissions.id)
      return acc
    }, {})

    return Object.entries(grouped).map(([role, permissions]) => ({
      role,
      permissions,
    }))
  }

  const updateRolePermissions = async (rolePermissions: any[]) => {
    // Primero eliminar todos los permisos existentes
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos

    if (deleteError) throw deleteError

    // Insertar los nuevos permisos
    const permissionsToInsert = rolePermissions.flatMap(rp =>
      rp.permissions.map((permissionId: string) => ({
        role: rp.role,
        permission_id: permissionId,
      }))
    )

    if (permissionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(permissionsToInsert)

      if (insertError) throw insertError
    }
  }

  return {
    getPermissions,
    getRolePermissions,
    updateRolePermissions,
  }
}
