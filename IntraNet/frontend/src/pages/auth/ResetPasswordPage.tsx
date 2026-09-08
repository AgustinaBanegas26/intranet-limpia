import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ThemeToggle } from '../../components/ThemeToggle'
import { PasswordStrengthBar } from '../../components/ui/PasswordStrengthBar'
import { supabase } from '../../config/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Status variables
  const [isValidating, setIsValidating] = useState(true)
  const [isValidLink, setIsValidLink] = useState(false)

  useEffect(() => {
    let mounted = true

    const processCode = async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          
          if (mounted) {
            setIsValidLink(true)
          }
        } catch (err) {
          console.error('[Reset Password]', err)
          if (mounted) {
            setIsValidLink(false)
          }
        }
      } else {
        // Fallback: verificar si ya hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession()
        if (session && mounted) {
          setIsValidLink(true)
        } else if (mounted) {
          setIsValidLink(false)
        }
      }
      
      if (mounted) {
        setIsValidating(false)
      }
    }

    processCode()

    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setError('')
    setLoading(true)
    setSuccess('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        throw updateError
      }
      
      setSuccess('Contraseña actualizada correctamente. Ya podés iniciar sesión con tu nueva contraseña.')
    } catch (err: any) {
      console.error('[Reset Password]', err)
      setError('No se pudo actualizar la contraseña. Intentá nuevamente o solicitá un nuevo enlace.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="auth-logo-wrap">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: 'var(--accent)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={26} />
          </div>
        </div>

        <h1 className="auth-title">Restablecer contraseña</h1>

        {isValidating ? (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p className="auth-subtitle">Validando enlace de recuperación...</p>
          </div>
        ) : !isValidLink ? (
          <div style={{ marginTop: 16 }}>
            <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <AlertCircle size={18} />
              El enlace de recuperación expiró o ya no es válido.
            </div>
            <button
              type="button"
              className="btn btn-lg btn-outline btn-full"
              style={{ marginTop: 24 }}
              onClick={() => {
                window.history.replaceState({}, document.title, window.location.pathname)
                navigate('/')
              }}
            >
              Solicitar un nuevo enlace
            </button>
          </div>
        ) : success ? (
          <div style={{ marginTop: 16 }}>
            <div className="auth-success" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', textAlign: 'center', padding: '16px' }}>
              <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
            <button
              type="button"
              className="btn btn-lg btn-primary-fill btn-full"
              style={{ marginTop: 24 }}
              onClick={async () => {
                window.history.replaceState({}, document.title, window.location.pathname)
                await supabase.auth.signOut()
                navigate('/')
              }}
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            <p className="auth-subtitle">
              Creá una nueva contraseña para volver a acceder a tu cuenta.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
              <div className="form-field">
                <label className="form-label" htmlFor="new-password">
                  Nueva contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="form-input"
                    style={{ paddingRight: 48 }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 0,
                      cursor: 'pointer',
                      color: 'var(--muted-foreground)',
                      display: 'flex',
                    }}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrengthBar password={password} />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="confirm-password">
                  Confirmar nueva contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repetí la contraseña"
                    className="form-input"
                    style={{ paddingRight: 48 }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 0,
                      cursor: 'pointer',
                      color: 'var(--muted-foreground)',
                      display: 'flex',
                    }}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-lg btn-primary-fill btn-full"
                style={{ marginTop: 8 }}
              >
                {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
