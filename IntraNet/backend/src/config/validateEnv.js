const MIN_JWT_SECRET_LENGTH = 32

// Prepara el valor para su uso.
function parseCorsOrigins() {
  return String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

// Comprueba los datos o la condicion indicada.
function validateEnv({ exitOnError = false } = {}) {
  const isProduction = process.env.NODE_ENV === 'production'
  const errors = []
  const warnings = []

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required')
  } else if (process.env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    const msg = `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`
    if (isProduction) errors.push(msg)
    else warnings.push(msg)
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    const msg = 'SUPABASE_URL and SUPABASE_SERVICE_KEY are required for database access'
    if (isProduction) errors.push(msg)
    else warnings.push(msg)
  }

  const smtpHost = String(process.env.SMTP_HOST || '').trim()
  const smtpPort = Number(process.env.SMTP_PORT)
  const smtpUser = String(process.env.SMTP_USER || '').trim()
  const smtpPassword = String(process.env.SMTP_PASS || '').trim().replace(/\s+/g, '')
  const smtpFrom = String(process.env.SMTP_FROM || '').trim()
  if (!smtpHost || !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535 || !smtpUser || !smtpPassword || smtpPassword === 'CONTRASEÑA_DE_APLICACION' || !smtpFrom) {
    warnings.push('El correo de recuperación no está configurado correctamente (revisá SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM)')
  }

  if (!String(process.env.EMAIL_RECIBIDOS || '').trim()) {
    warnings.push('EMAIL_RECIBIDOS no está configurada; las notificaciones de solicitudes no tendrán destinatario')
  }

  if (isProduction) {
    const corsOrigins = parseCorsOrigins()
    if (corsOrigins.length === 0) {
      errors.push('CORS_ORIGINS is required when NODE_ENV=production (comma-separated frontend URLs)')
    } else {
      // Recorre los elementos de la coleccion.
      for (const origin of corsOrigins) {
        if (!/^https:\/\//i.test(origin)) {
          warnings.push(`CORS_ORIGINS entry should use HTTPS in production: ${origin}`)
        }
        if (origin.endsWith('/')) {
          errors.push(`CORS_ORIGINS entries must not end with /: ${origin}`)
        }
      }
    }
  }

  // Recorre los elementos de la coleccion.
  for (const warning of warnings) {
    console.warn(`[backend] WARN: ${warning}`)
  }

  if (errors.length > 0) {
    // Recorre los elementos de la coleccion.
    for (const error of errors) {
      console.error(`[backend] FATAL: ${error}`)
    }
    if (exitOnError) process.exit(1)
  }

  return { ok: errors.length === 0, errors, warnings, isProduction }
}

module.exports = { validateEnv, parseCorsOrigins }
