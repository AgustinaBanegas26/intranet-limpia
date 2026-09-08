const { createClient } = require('@supabase/supabase-js')

const rawUrl = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

// Normalizar URL: quitar "/rest/v1" si alguien la pegó completa y eliminar slashes finales
const SUPABASE_URL = rawUrl
  ? String(rawUrl).replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  : undefined

if (process.env.NODE_ENV !== 'production') {
  console.log('[supabase] SUPABASE_URL', SUPABASE_URL)
  console.log('[supabase] SUPABASE_KEY_EXISTS', !!SUPABASE_SERVICE_KEY)
}

let supabase = null
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  // Crear cliente Supabase con Service Role Key (solo backend)
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
} else {
  const missing = []
  if (!SUPABASE_URL) missing.push('SUPABASE_URL')
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY')
  const message = `Supabase client not configured: missing ${missing.join(' and ')}`
  console.error('[supabase] FATAL:', message)
  throw new Error(message)
}

module.exports = supabase
