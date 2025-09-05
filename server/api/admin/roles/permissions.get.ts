import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('role_permissions')
    .select('role, permission_id, permissions(id, name)')
  if (error) {
    setResponseStatus(event, 500)
    return { error: 'Error al cargar los permisos de roles' }
  }
  const roles = ['admin', 'staff', 'usuario'] as const
  const rolePermissions = roles.map(role => ({
    role,
    permissions: (data || [])
      .filter((i: any) => i.role === role)
      .map((i: any) => i.permission_id),
  }))
  return { rolePermissions }
})
