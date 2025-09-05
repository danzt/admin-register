import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const userSchema = z.object({
  idNumber: z.string().min(1, 'La cédula es requerida'),
  firstNames: z.string().min(1, 'El nombre es requerido'),
  lastNames: z.string().min(1, 'Los apellidos son requeridos'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().email('Correo electrónico inválido').optional().nullable(),
  baptismDate: z.string().optional().nullable(),
  whatsapp: z.boolean().default(false),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

const importUsersSchema = z.object({ users: z.array(z.any()) })

export default defineEventHandler(async event => {
  try {
    const body = await readBody(event)
    const validation = importUsersSchema.safeParse(body)
    if (!validation.success) {
      setResponseStatus(event, 400)
      return {
        error: 'Datos de usuarios inválidos',
        details: validation.error.errors,
      }
    }
    const { users } = validation.data as any

    const client = await serverSupabaseClient(event)

    const config = useRuntimeConfig(event)
    const admin =
      config.SUPABASE_SERVICE_KEY && config.public.SUPABASE_URL
        ? createClient(
            config.public.SUPABASE_URL,
            config.SUPABASE_SERVICE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )
        : null

    let success = 0
    let skipped = 0
    let failed = 0
    const errors: Array<{ cedula: string; error: string }> = []

    for (const raw of users as any[]) {
      try {
        const parsed = userSchema.safeParse(raw)
        if (!parsed.success) {
          skipped++
          const msg = parsed.error.errors[0]?.message || 'Datos inválidos'
          errors.push({
            cedula: raw.idNumber || 'Desconocido',
            error: `Ignorado: ${msg}`,
          })
          continue
        }
        const u = parsed.data

        // Si hay admin client y correo, comprobar o crear auth
        if (u.email && admin) {
          try {
            const { data: listed } = await admin.auth.admin.listUsers()
            const existing = listed.users?.find(x => x.email === u.email)
            if (!existing) {
              await admin.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true,
                user_metadata: {
                  idNumber: u.idNumber,
                  firstNames: u.firstNames,
                  lastNames: u.lastNames,
                },
              })
            }
          } catch (e) {
            console.warn('Auth process error for', u.idNumber, e)
          }
        }

        const { data: existing } = await client
          .from('users')
          .select('id, id_number')
          .eq('id_number', u.idNumber)
          .maybeSingle()

        if (existing) {
          const { error: updateError } = await client
            .from('users')
            .update({
              first_names: u.firstNames,
              last_names: u.lastNames,
              phone: u.phone || null,
              address: u.address || null,
              email: u.email || null,
              baptism_date: u.baptismDate || null,
              whatsapp: u.whatsapp,
            })
            .eq('id', existing.id)
          if (updateError) {
            failed++
            errors.push({
              cedula: u.idNumber,
              error: `Error al actualizar: ${updateError.message}`,
            })
          } else {
            success++
          }
        } else {
          const hash = await bcrypt.hash(u.password, 10)
          const { error: insertError } = await client.from('users').insert([
            {
              id_number: u.idNumber,
              first_names: u.firstNames,
              last_names: u.lastNames,
              phone: u.phone || null,
              address: u.address || null,
              email: u.email || null,
              baptism_date: u.baptismDate || null,
              whatsapp: u.whatsapp,
              password_hash: hash,
            },
          ])
          if (insertError) {
            failed++
            errors.push({
              cedula: u.idNumber,
              error: `Error al insertar: ${insertError.message}`,
            })
          } else {
            success++
          }
        }
      } catch (e: any) {
        failed++
        errors.push({
          cedula: raw.idNumber || 'Desconocido',
          error: e.message || 'Error desconocido',
        })
      }
    }

    return {
      success,
      failed,
      skipped,
      total: users.length,
      errors: errors.length ? errors : undefined,
    }
  } catch (error: any) {
    console.error('Error en la importación de usuarios:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Ocurrió un error durante la importación de usuarios',
      details: error.message,
    }
  }
})
