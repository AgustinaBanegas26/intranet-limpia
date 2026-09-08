import { z } from 'zod'

const MSGS = {
  required: 'Este campo es obligatorio.',
  invalidEmail: 'El email tiene un formato inválido.',
  shortPassword: 'La contraseña debe tener al menos 6 caracteres.',
}

export const loginSchema = z.object({
  email: z.string().min(1, MSGS.required).email(MSGS.invalidEmail),
  password: z.string().min(1, MSGS.required).min(6, MSGS.shortPassword),
})

export type LoginFormValues = z.infer<typeof loginSchema>
