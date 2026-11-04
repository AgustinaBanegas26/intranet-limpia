// Este servicio implementa la recuperación de acceso sin depender de Supabase Auth.
// Consulta empleados mediante el cliente Supabase del backend, conserva únicamente
// hashes de códigos en la tabla auxiliar y delega operaciones atómicas en RPC SQL.
// Lo utilizan los endpoints públicos /auth/password-recovery de src/index.js.
const nodemailer = require('nodemailer')
const supabase = require('../config/supabase')
const {
  generateRecoveryCode,
  hashRecoveryValue,
  hashRateLimitValue,
} = require('../utils/passwordRecoveryCrypto')

const TOKEN_TTL_MINUTES = 15
const RECOVERY_MESSAGE = 'Si la cuenta existe, recibirás un código de recuperación en el correo corporativo.'

// Busca exclusivamente cuentas activas con el correo corporativo exacto.
// Devuelve datos mínimos para el envío y evita el fallback aproximado del login.
async function findActiveEmployeeByEmail(email) {
  const { data, error } = await supabase
    .from('empleados')
    .select('id, email_corporativo, nombre, apellido')
    .eq('email_corporativo', email)
    .eq('activo', true)
    .maybeSingle()

  if (error) throw error
  return data || null
}

// Configura el transporte SMTP existente mediante Nodemailer. Si faltan credenciales,
// falla explícitamente para no simular que el correo fue entregado.
function createRecoveryTransporter() {
  // Acepta los nombres actuales del despliegue y los nombres históricos del
  // servicio de email; así no hace falta duplicar secretos en el panel.
  const user = String(process.env.SMTP_USER || process.env.EMAIL_USER || '').trim()
  const pass = String(process.env.SMTP_APP_PASSWORD || process.env.EMAIL_PASS || '').trim()
  if (!user || !pass || pass === 'CONTRASEÑA_DE_APLICACION') {
    const error = new Error('email_not_configured')
    error.code = 'email_not_configured'
    throw error
  }

  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
}

// Entrega el código al correo corporativo y no registra ni retorna el código.
async function sendRecoveryCode(employee, code) {
  const transporter = createRecoveryTransporter()
  const appUrl = String(process.env.FRONTEND_URL || '').trim().replace(/\/$/, '')
  const name = [employee.nombre, employee.apellido].filter(Boolean).join(' ')
  const resetUrl = appUrl ? `${appUrl}/reset-password` : null
  const linkHtml = resetUrl
    ? `<p>Ingresá el código en <a href="${resetUrl}">esta pantalla de recuperación</a>.</p>`
    : '<p>Abrí la pantalla de recuperación de contraseña de la intranet e ingresá el código.</p>'

  await transporter.sendMail({
    from: process.env.SMTP_USER || process.env.EMAIL_USER,
    to: employee.email_corporativo,
    subject: 'Código para recuperar el acceso a la intranet',
    text: `Hola${name ? ` ${name}` : ''}. Tu código de recuperación es ${code}. Vence en ${TOKEN_TTL_MINUTES} minutos. Si no solicitaste este cambio, ignorá este correo.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Recuperar acceso</h2><p>Hola${name ? ` ${name}` : ''}. Ingresá este código en la intranet:</p><p style="font-size:20px;font-weight:bold;letter-spacing:2px;word-break:break-all">${code}</p><p>El código vence en ${TOKEN_TTL_MINUTES} minutos y se puede usar una sola vez.</p>${linkHtml}<p>Si no solicitaste este cambio, ignorá este correo.</p></div>`,
  })
}

// Registra cada solicitud, aplica topes por correo e IP, e invalida códigos
// anteriores dentro de la función SQL; sólo después intenta enviar el nuevo.
async function requestRecovery(email, ip) {
  const employee = await findActiveEmployeeByEmail(email)
  const code = employee ? generateRecoveryCode() : null
  const emailHash = hashRateLimitValue(`email:${email}`)
  const ipHash = hashRateLimitValue(`ip:${ip || 'unknown'}`)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString()

  const { data, error } = await supabase.rpc('request_password_recovery', {
    p_employee_id: employee?.id || null,
    p_email_hash: emailHash,
    p_ip_hash: ipHash,
    p_token_hash: code ? hashRecoveryValue(code) : null,
    p_expires_at: code ? expiresAt : null,
  })
  if (error) throw error

  const allowed = data === true || data?.allowed === true
  if (allowed && employee && code) {
    try {
      await sendRecoveryCode(employee, code)
    } catch (error) {
      // El token no se expone en logs; se invalida si el proveedor de correo falla.
      await supabase.rpc('invalidate_password_recovery_by_hash', {
        p_email_hash: emailHash,
        p_token_hash: hashRecoveryValue(code),
      }).catch(() => {})
      throw error
    }
  }

  return { message: RECOVERY_MESSAGE }
}

// Verifica el código en SQL y registra allí los intentos fallidos con bloqueo.
async function verifyRecoveryCode(email, code) {
  const { data, error } = await supabase.rpc('verify_password_recovery', {
    p_email_hash: hashRateLimitValue(`email:${email}`),
    p_token_hash: hashRecoveryValue(code),
  })
  if (error) throw error
  return data === true || data?.valid === true
}

// Hashea la nueva contraseña con el mismo bcrypt que utiliza el login y consume
// el código en una única transacción SQL para impedir reutilización concurrente.
async function resetPassword(email, code, password) {
  const bcrypt = require('bcrypt')
  const passwordHash = await bcrypt.hash(password, 10)
  const { data, error } = await supabase.rpc('reset_employee_password_with_recovery', {
    p_email_hash: hashRateLimitValue(`email:${email}`),
    p_token_hash: hashRecoveryValue(code),
    p_password_hash: passwordHash,
  })
  if (error) throw error
  return data === true || data?.updated === true
}

module.exports = {
  TOKEN_TTL_MINUTES,
  RECOVERY_MESSAGE,
  generateRecoveryCode,
  hashRecoveryValue,
  hashRateLimitValue,
  requestRecovery,
  verifyRecoveryCode,
  resetPassword,
}
