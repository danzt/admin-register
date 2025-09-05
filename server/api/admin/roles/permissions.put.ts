import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  try {
    const { rolePermissions } = await readBody<{
      rolePermissions: {
        role: 'admin' | 'staff' | 'usuario'
        permissions: string[]
      }[]
    }>(event)
    if (!Array.isArray(rolePermissions)) {
      setResponseStatus(event, 400)
      return { error: 'Formato de datos inválido' }
    }
    const client = await serverSupabaseClient(event)
    const updatedRoles: string[] = []

    for (const rp of rolePermissions) {
      const { role, permissions } = rp
      if (!role || !Array.isArray(permissions)) continue
      const { error: delErr } = await client
        .from('role_permissions')
        .delete()
        .eq('role', role)
      if (delErr) continue
      if (permissions.length > 0) {
        const records = permissions.map(permissionId => ({
          role,
          permission_id: permissionId,
        }))
        const { error: insErr } = await client
          .from('role_permissions')
          .insert(records)
        if (insErr) continue
      }
      updatedRoles.push(role)
    }

    return {
      success: true,
      message: `Roles actualizados: ${updatedRoles.join(', ')}`,
    }
  } catch {
    setResponseStatus(event, 500)
    return { error: 'Error interno del servidor' }
  }
})
