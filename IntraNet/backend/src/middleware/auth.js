// Middleware de JWT propio para las rutas protegidas de Express. El login firma
// el token y este módulo valida firma, versión de credenciales y cambio obligatorio.
const { getMustChangePassword } = require('../services/empleados.service')

// Obtiene el secreto de firma desde el entorno del backend, nunca desde Vite.
function getJwtSecret() {
  return process.env.JWT_SECRET
}

// Verifica los JWT propios que emite el login del portal y compara credential_version
// para rechazar sesiones emitidas antes de un cambio de contraseña.
async function authenticateToken(req, res, next) {
  const jwt = require('jsonwebtoken')
  const supabase = require('../config/supabase')
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'unauthorized_token_missing' })
  }

  const secret = getJwtSecret()
  jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'invalid_token' })
    }

    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('credential_version')
        .eq('id', decoded.sub)
        .maybeSingle()
      if (error) {
        return res.status(503).json({ error: 'service_unavailable' })
      }
      if (!data || Number(decoded.credentialVersion || 0) !== Number(data.credential_version || 0)) {
        return res.status(403).json({ error: 'invalid_token' })
      }
    } catch {
      return res.status(503).json({ error: 'service_unavailable' })
    }

    req.user = decoded
    return next()
  })
}

// Reconoce la ruta excepcional de cambio forzoso para permitir resolverla.
function isChangePasswordRoute(req) {
  return (
    req.method === 'PUT' &&
    (req.path === '/auth/change-password' || req.originalUrl.endsWith('/auth/change-password'))
  )
}

// Deja consultar el perfil incluso cuando falta el cambio de primera contraseña.
function isProfileRoute(req) {
  return req.method === 'GET' && (req.path === '/profile' || req.originalUrl.endsWith('/profile'))
}

/**
 * Bloquea rutas protegidas cuando el usuario debe cambiar contraseña.
 * Valida contra DB (autoridad) además del flag JWT.
 * Solo permite PUT /auth/change-password.
 */
async function requirePasswordChanged(req, res, next) {
  // Allow changing password and fetching profile even when mustChangePassword is true
  if (isChangePasswordRoute(req) || isProfileRoute(req)) {
    return next()
  }

  const userId = req.user?.sub
  if (!userId) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  try {
    const mustChange = await getMustChangePassword(userId)
    if (!mustChange) {
      return next()
    }
  } catch (err) {
    console.error('[auth] requirePasswordChanged DB check failed:', err)
    return res.status(503).json({
      error: 'service_unavailable',
      message: 'El servicio no está disponible. Intentá de nuevo más tarde.',
    })
  }

  return res.status(403).json({
    error: 'password_change_required',
    message: 'Debés cambiar tu contraseña antes de continuar.',
  })
}

// Firma la sesión propia por 24 horas; el número de credencial permite revocarla.
function signToken(payload) {
  const jwt = require('jsonwebtoken')
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' })
}

module.exports = {
  authenticateToken,
  requirePasswordChanged,
  signToken,
  getJwtSecret,
}
