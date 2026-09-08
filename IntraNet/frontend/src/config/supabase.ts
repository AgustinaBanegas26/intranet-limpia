import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '')
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')

const missingUrl = !supabaseUrl || supabaseUrl.includes('placeholder')
const missingAnon = !supabaseAnonKey || supabaseAnonKey === 'placeholder'
const envState = {
  supabaseUrl,
  supabaseUrlLength: supabaseUrl.length,
  supabaseAnonKeyPresent: Boolean(supabaseAnonKey),
  supabaseAnonKeyLength: supabaseAnonKey.length,
  missingUrl,
  missingAnon,
}

if (missingUrl || missingAnon) {
  console.warn('[Supabase] Missing or placeholder envs detected. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment (do not commit keys).')
  console.warn('[Supabase] Env state:', JSON.stringify(envState))
} else {
  try {
    const masked = supabaseAnonKey.replace(/.(?=.{4})/g, '*')
    console.info('[Supabase] Current URL:', supabaseUrl)
    console.info('[Supabase] Anon key present (masked):', masked)
  } catch {
    // ignore
  }
}

// Runtime sanity: try to decode anon key (JWT) and compare project ref with URL host.
try {
  const anon = String(supabaseAnonKey || '')
  const parts = anon.split('.')
  if (parts.length === 3) {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const ref = String(payload?.ref || '')
    try {
      const urlHost = new URL(String(supabaseUrl || '')).host.replace('.supabase.co', '')
      if (ref && urlHost && ref !== urlHost) {
        console.warn(
          '[Supabase] Anon key project ref does not match VITE_SUPABASE_URL host. This will cause "Invalid API key" errors.'
        )
        console.warn('[Supabase] Key ref:', ref, 'URL host:', urlHost)
      }
    } catch (error) {
      console.warn('[Supabase] Could not parse VITE_SUPABASE_URL for ref validation.', error)
    }
  }
} catch (error) {
  console.warn('[Supabase] Could not decode anon key payload.', error)
}

export const supabase = createClient(
  String(supabaseUrl || 'https://placeholder.supabase.co'),
  String(supabaseAnonKey || 'placeholder'),
)
