import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async event => {
  try {
    const id = getRouterParam(event, 'id')
    const client = await serverSupabaseClient(event)

    const { data: userToDelete, error: fetchError } = await client
      .from('users')
      .select('id, email')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        setResponseStatus(event, 404)
        return { message: 'Usuario no encontrado para eliminar' }
      }
      console.error('Error al buscar usuario para eliminar:', fetchError)
      setResponseStatus(event, 500)
      return {
        message: 'Error al buscar el usuario',
        error: fetchError.message,
      }
    }

    const { error: deleteDbError } = await client
      .from('users')
      .delete()
      .eq('id', id)
    if (deleteDbError) {
      console.error(
        'Error al eliminar usuario de la base de datos:',
        deleteDbError
      )
      setResponseStatus(event, 500)
      return {
        message: 'Error al eliminar el usuario de la base de datos',
        error: deleteDbError.message,
      }
    }

    const config = useRuntimeConfig(event)
    if (
      userToDelete?.email &&
      config.SUPABASE_SERVICE_KEY &&
      config.public.SUPABASE_URL
    ) {
      try {
        const admin = createClient(
          config.public.SUPABASE_URL,
          config.SUPABASE_SERVICE_KEY,
          {
            auth: { autoRefreshToken: false, persistSession: false },
          }
        )
        const { data: listed, error: listError } =
          await admin.auth.admin.listUsers()
        if (!listError) {
          const authUser = listed.users?.find(
            u => u.email === userToDelete.email
          )
          if (authUser) {
            const { error: delErr } = await admin.auth.admin.deleteUser(
              authUser.id
            )
            if (delErr) {
              console.warn(
                'Error al eliminar usuario de Supabase Auth:',
                delErr.message
              )
              return {
                message:
                  'Usuario eliminado de DB, pero falló eliminar en Auth. Revise manualmente.',
              }
            }
          }
        }
      } catch (e: any) {
        console.warn('Error durante eliminación en Auth:', e?.message || e)
      }
    }

    return { message: 'Usuario eliminado exitosamente' }
  } catch (error: any) {
    console.error('Error general al eliminar usuario:', error)
    setResponseStatus(event, 500)
    return {
      message: 'Error interno del servidor al eliminar el usuario',
      error: error.message,
    }
  }
})
