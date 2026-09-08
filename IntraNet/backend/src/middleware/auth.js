const { getMustChangePassword } = require('../services/empleados.service')

function getJwtSecret() {
  return process.env.JWT_SECRET
}

async function authenticateToken(req, res, next) {
  const jwt = require('jsonwebtoken')
  const supabase = require('../config/supabase')
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'unauthorized_token_missing' })
  }

  try {
    // 1. Intentar validar con Supabase Auth primero
    const { data: { user }, error: sbError } = await supabase.auth.getUser(token)
    
    if (!sbError && user) {
      // 2. Si es válido en Supabase, buscamos el empleado asociado
      const { data: empleado, error: empError } = await supabase
        .from('empleados')
        .select('id, role, es_director')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (empError || !empleado) {
        return res.status(403).json({ error: 'empleado_not_found_for_auth_user' })
      }

      req.user = {
        sub: empleado.id,
        role: empleado.role || (empleado.es_director ? 'director' : 'empleado'),
        email: user.email
      }
      return next()
    }
  } catch (err) {
    console.error('[auth] Supabase token verification failed:', err)
  }

  // 3. Fallback: Si no era un token de Supabase, validamos como token heredado
  const secret = getJwtSecret()
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'invalid_token' })
    }
    req.user = decoded
    next()
  })
}

function isChangePasswordRoute(req) {
  return (
    req.method === 'PUT' &&
    (req.path === '/auth/change-password' || req.originalUrl.endsWith('/auth/change-password'))
  )
}

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
