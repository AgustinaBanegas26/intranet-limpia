/** Decodifica exp del JWT sin verificar firma (solo para UX de sesión). */
export function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    if (!payload.exp) return false
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export function isSessionAuthError(code: string): boolean {
  return (
    code === 'invalid_token' ||
    code === 'unauthorized_token_missing' ||
    code === 'unauthorized'
  )
}

export function authErrorMessage(code: string): string {
  switch (code) {
    case 'invalid_token':
    case 'unauthorized_token_missing':
    case 'unauthorized':
      return 'Tu sesión expiró. Cerrá sesión e iniciá de nuevo.'
    case 'password_change_required':
      return 'Debés cambiar tu contraseña antes de continuar.'
    case 'forbidden':
      return 'No tenés permiso para publicar novedades.'
    case 'missing_fields':
      return 'Completá título y mensaje.'
    case 'failed_to_create_novedad':
      return 'No se pudo publicar. Intentá de nuevo más tarde.'
    default:
      return 'No se pudo publicar. Intentá de nuevo.'
  }
}
