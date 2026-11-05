// Transporte SMTP del flujo de recuperación. Lee secretos sólo del entorno del
// backend; la prueba verify() negocia TLS y autentica, pero no envía un correo.
const nodemailer = require('nodemailer')

// Valida configuración y devuelve un transporte Nodemailer con TLS requerido.
// 465 usa TLS implícito; los demás puertos configurados exigen STARTTLS.
function createRecoveryTransporter() {
  const host = String(process.env.SMTP_HOST || '').trim()
  const port = Number(process.env.SMTP_PORT)
  const user = String(process.env.SMTP_USER || '').trim()
  const pass = String(process.env.SMTP_PASS || '').trim().replace(/\s+/g, '')
  const from = String(process.env.SMTP_FROM || '').trim()
  const missing = []

  if (!host) missing.push('SMTP_HOST')
  if (!process.env.SMTP_PORT || !Number.isInteger(port) || port < 1 || port > 65535) {
    missing.push('SMTP_PORT')
  }
  if (!user) missing.push('SMTP_USER')
  if (!pass || pass === 'CONTRASEÑA_DE_APLICACION') missing.push('SMTP_PASS')
  if (!from) missing.push('SMTP_FROM')

  if (missing.length) {
    const error = new Error('email_not_configured')
    error.code = 'email_not_configured'
    error.missingVariables = missing
    throw error
  }

  const secure = port === 465
  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    logger: false,
    debug: false,
  })
}

// Prueba conexión SMTP y autenticación sin mandar correo ni mostrar secretos.
async function verifyRecoveryEmailTransport() {
  await createRecoveryTransporter().verify()
  return true
}

module.exports = { createRecoveryTransporter, verifyRecoveryEmailTransport }
