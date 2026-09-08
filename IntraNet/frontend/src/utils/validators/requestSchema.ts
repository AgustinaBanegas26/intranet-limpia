import { z } from 'zod'

export const VALIDATION_MESSAGES = {
  required: 'Este campo es obligatorio.',
  invalidEmail: 'El email tiene un formato inválido.',
  requestName: 'Completá tu nombre.',
  requestLocation: 'Completá la ubicación.',
  requestDestination: 'Completá el destino.',
  selectOption: 'Seleccioná una opción válida.',
  requestSector: 'Seleccioná un sector.',
  requestBranch: 'Seleccioná una sucursal.',
}

export const requestSchema = z.object({
  tipo: z.enum(['auto', 'hotel']),
  nombre: z.string().min(1, VALIDATION_MESSAGES.requestName).min(3, VALIDATION_MESSAGES.requestName),
  email: z.string().min(1, VALIDATION_MESSAGES.required).email(VALIDATION_MESSAGES.invalidEmail),
  ubicacion: z
    .string()
    .min(1, VALIDATION_MESSAGES.requestLocation)
    .min(3, VALIDATION_MESSAGES.requestLocation),
  destino: z
    .string()
    .min(1, VALIDATION_MESSAGES.requestDestination)
    .min(3, VALIDATION_MESSAGES.requestDestination),
  cantidad: z.string().min(1, VALIDATION_MESSAGES.selectOption),
  acompanantes: z.string().optional(),
  sector: z.string().min(1, VALIDATION_MESSAGES.requestSector),
  sucursal: z.string().min(1, VALIDATION_MESSAGES.requestBranch),
  motivo: z.string().optional(),
  pedirTambien: z.boolean(),
  fecha: z.string().optional(),
})

export type RequestFormValues = z.infer<typeof requestSchema>

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeText(text: string) {
  return text.trim()
}
