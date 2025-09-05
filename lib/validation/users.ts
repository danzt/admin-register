import { z } from 'zod'

export const userFormSchema = z
  .object({
    idNumber: z.string().min(1, 'La cédula es obligatoria'),
    firstNames: z.string().min(1, 'Los nombres son obligatorios'),
    lastNames: z.string().min(1, 'Los apellidos son obligatorios'),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    email: z.string().email('Correo inválido').optional().nullable(),
    baptismDate: z.string().optional().nullable(),
    whatsapp: z.boolean().optional(),
    baptized: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.baptized) {
      const value = (data.baptismDate || '').trim()
      if (!value) {
        ctx.addIssue({
          code: 'custom',
          message: 'La fecha de bautizo es obligatoria',
          path: ['baptismDate'],
        })
      }
    }
  })

export type UserFormInput = z.infer<typeof userFormSchema>
