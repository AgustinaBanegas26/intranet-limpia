const cors = require('cors')

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]

const DEFAULT_PROD_ORIGINS = [
  'https://intranet.gruponucleo.com',
  'https://www.intranet.gruponucleo.com',
  'https://intranet.gruponucleo.com.ar',
  'https://www.intranet.gruponucleo.com.ar',
  'https://intranet-oficial.vercel.app',
]

function getAllowedOrigins() {
  const envOrigins = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  if (envOrigins.length > 0) {
    return envOrigins
  }

  return process.env.NODE_ENV === 'production'
    ? [...DEFAULT_DEV_ORIGINS, ...DEFAULT_PROD_ORIGINS]
    : DEFAULT_DEV_ORIGINS
}

function isAllowedOrigin(origin) {
  const allowedOrigins = getAllowedOrigins()

  if (!origin) {
    return true
  }

  if (allowedOrigins.includes(origin)) {
    return true
  }

  const normalizedOrigin = origin.toLowerCase()
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return true
  }
  if (normalizedOrigin.endsWith('.vercel.app')) {
    return true
  }
  if (normalizedOrigin.includes('gruponucleo.com')) {
    return true
  }

  return false
}

function createCorsMiddleware() {
  return cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS: origin not allowed: ${origin}`))
    },
    credentials: false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  })
}

module.exports = { createCorsMiddleware, getAllowedOrigins }
