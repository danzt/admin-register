import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const userUpdateSchema = z.object({
  idNumber: z.string().min(1, 'La cédula es obligatoria'),
  firstNames: z.string().min(1, 'Los nombres son obligatorios'),
  lastNames: z.string().min(1, 'Los apellidos son obligatorios'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .nullable()
    .optional(),
  baptismDate: z.string().nullable().optional(),
  whatsapp: z.boolean().default(false),
  baptized: z.boolean().default(false),
})

export default defineEventHandler(async event => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const parsed = userUpdateSchema.safeParse(body)
    if (!parsed.success) {
      setResponseStatus(event, 400)
      return { error: 'Datos inválidos', details: parsed.error.format() }
    }
    const userData = parsed.data

    const client = await serverSupabaseClient(event)

    const { data: existingUser, error: checkError } = await client
      .from('users')
      .select('id, id_number, email')
      .eq('id', id)
      .maybeSingle()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        setResponseStatus(event, 404)
        return { error: 'Usuario no encontrado' }
      }
      throw checkError
    }

    if (existingUser && existingUser.id_number !== userData.idNumber) {
      const { data: idNumberCheck } = await client
        .from('users')
        .select('id')
        .eq('id_number', userData.idNumber)
        .maybeSingle()
      if (idNumberCheck) {
        setResponseStatus(event, 400)
        return { error: 'La cédula ya está en uso por otro usuario' }
      }
    }

    // Si cambia el email, actualizar en Auth con service key
    const config = useRuntimeConfig(event)
    if (
      userData.email &&
      existingUser?.email !== userData.email &&
      config.SUPABASE_SERVICE_KEY &&
      config.public.SUPABASE_URL
    ) {
      const admin = createClient(
        config.public.SUPABASE_URL,
        config.SUPABASE_SERVICE_KEY,
        {
          auth: { autoRefreshToken: false, persistSession: false },
        }
      )
      try {
        // No tenemos id de auth, buscar por email actual en listado
        const { data: listed, error: listErr } =
          await admin.auth.admin.listUsers()
        if (!listErr) {
          const authUser = listed.users?.find(
            u => u.email === existingUser?.email
          )
          if (authUser) {
            await admin.auth.admin.updateUserById(authUser.id, {
              email: userData.email || '',
            })
          }
        }
      } catch (e) {
        console.warn('Error en actualización de email en Auth:', e)
      }
    }

    const { data: updatedUser, error: updateError } = await client
      .from('users')
      .update({
        id_number: userData.idNumber,
        first_names: userData.firstNames,
        last_names: userData.lastNames,
        phone: userData.phone || 'Sin teléfono',
        address: userData.address || 'Sin dirección',
        email: userData.email || null,
        baptism_date: userData.baptismDate || null,
        whatsapp: userData.whatsapp,
        baptized: userData.baptized,
      })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (updateError) throw updateError

    return { user: updatedUser, message: 'Usuario actualizado exitosamente' }
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    setResponseStatus(event, 500)
    return { error: 'Error al actualizar el usuario' }
  }
})
