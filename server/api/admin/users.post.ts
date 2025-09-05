import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const userSchema = z.object({
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
    const body = await readBody(event)
    const parsed = userSchema.safeParse(body)
    if (!parsed.success) {
      setResponseStatus(event, 400)
      return { error: 'Datos inválidos', details: parsed.error.format() }
    }
    const userData = parsed.data

    const client = await serverSupabaseClient(event)

    // Verificar cédula duplicada
    const { data: existingUser, error: checkError } = await client
      .from('users')
      .select('id')
      .eq('id_number', userData.idNumber)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    if (existingUser) {
      setResponseStatus(event, 400)
      return { error: 'Ya existe un usuario con esta cédula' }
    }

    const temporalPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(temporalPassword, 10)

    // Crear usuario en Auth si tiene correo y hay service key
    const config = useRuntimeConfig(event)
    if (
      userData.email &&
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
        const { error: authError } = await admin.auth.admin.createUser({
          email: userData.email,
          password: temporalPassword,
          email_confirm: true,
          user_metadata: {
            idNumber: userData.idNumber,
            firstNames: userData.firstNames,
            lastNames: userData.lastNames,
          },
        })
        if (authError) {
          console.warn('Error al crear usuario en Auth:', authError.message)
        }
      } catch (e) {
        console.warn('Error en proceso de autenticación:', e)
      }
    }

    const { data: newUser, error: insertError } = await client
      .from('users')
      .insert([
        {
          id_number: userData.idNumber,
          first_names: userData.firstNames,
          last_names: userData.lastNames,
          phone: userData.phone || 'Sin teléfono',
          address: userData.address || 'Sin dirección',
          email: userData.email || null,
          baptism_date: userData.baptismDate || null,
          whatsapp: userData.whatsapp,
          baptized: userData.baptized,
          password_hash: hashedPassword,
        },
      ])
      .select()
      .maybeSingle()

    if (insertError) throw insertError

    setResponseStatus(event, 201)
    return {
      user: newUser,
      message: 'Usuario creado exitosamente',
      temporalPassword,
    }
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    setResponseStatus(event, 500)
    return { error: 'Error al crear el usuario' }
  }
})
