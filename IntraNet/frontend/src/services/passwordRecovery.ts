// Este archivo conecta las pantallas públicas de recuperación con Express.
// Sólo envía datos al backend propio; nunca llama a Supabase Auth ni guarda secretos.
import { getBackendUrl } from './auth'

type ApiResult = { ok?: boolean; message?: string; error?: string }

// Traduce códigos HTTP estables a mensajes útiles sin mostrar datos internos
// del servidor ni confundir una caída del servicio con un código inválido.
export function getPasswordRecoveryErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const code = error instanceof Error ? error.message : ''
  if (code === 'recovery_temporarily_unavailable') {
    return 'El servicio de recuperación no está disponible ahora. Intentá nuevamente más tarde.'
  }
  if (code === 'recovery_rate_limited') {
    return 'Se alcanzó el límite de solicitudes. Esperá unos minutos e intentá nuevamente.'
  }
  if (code === 'invalid_email') return 'Ingresá un correo electrónico válido.'
  return fallback
}

// Envía una solicitud de recuperación y devuelve el mensaje genérico del backend,
// que no revela si el correo está registrado.
export async function requestPasswordRecovery(email: string): Promise<string> {
  const result = await sendRecoveryRequest('/auth/password-recovery/request', { email })
  return result.message || 'Si la cuenta existe, recibirás un código en el correo corporativo.'
}

// Verifica el código; el backend aplica vencimiento y límites de intentos.
export async function verifyPasswordRecovery(email: string, code: string): Promise<void> {
  await sendRecoveryRequest('/auth/password-recovery/verify', { email, code })
}

// Solicita el cambio final; el backend guarda sólo el hash bcrypt de la contraseña.
export async function resetPasswordWithCode(
  email: string,
  code: string,
  password: string,
): Promise<string> {
  const result = await sendRecoveryRequest('/auth/password-recovery/reset', {
    email,
    code,
    password,
  })
  return result.message || 'La contraseña se actualizó correctamente.'
}

// Centraliza transporte y errores para que las tres operaciones tengan el mismo
// formato. El cuerpo nunca se imprime en consola para evitar exponer códigos.
async function sendRecoveryRequest(path: string, body: Record<string, string>): Promise<ApiResult> {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  let result: ApiResult = {}
  try {
    result = (await response.json()) as ApiResult
  } catch {
    // El error de transporte se presenta con un mensaje comprensible debajo.
  }

  if (!response.ok) {
    const error = new Error(result.error || 'recovery_request_failed')
    throw error
  }
  return result
}
