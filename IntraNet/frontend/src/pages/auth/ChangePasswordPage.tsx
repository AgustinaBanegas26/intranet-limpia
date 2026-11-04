import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { ThemeToggle } from '../../components/ThemeToggle'
import { PasswordStrengthBar } from '../../components/ui/PasswordStrengthBar'
import { useAuth } from '../../context/AuthContext'
import { changePassword } from '../../services/auth'

const ERROR_MESSAGES: Record<string, string> = {
  failed_to_change_password: 'No se pudo actualizar la contraseña.',
  invalid_current_password: 'La contraseña actual no es correcta.',
  password_too_weak: 'La contraseña debe tener al menos 8 caracteres.',
}

// Actualiza los datos correspondientes.
export function ChangePasswordPage() {
  const { user, onPasswordChanged } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Gestiona la accion correspondiente.
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
      const result = await changePassword({ password })
      setSuccess('Contraseña actualizada correctamente.')
      onPasswordChanged(result.token)
    } catch (err) {
      setError(ERROR_MESSAGES[err instanceof Error ? err.message : ''] || ERROR_MESSAGES.failed_to_change_password)
    } finally {
      setLoading(false)
    }
  }

  const firstName = user.name.trim().split(/\s+/)[0] || user.name

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
        {/* Icon */}
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

        <h1 className="auth-title">Cambiar contraseña</h1>
        <p className="auth-subtitle">
          Hola {firstName}. Por seguridad, definí una contraseña personal antes de continuar.
        </p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

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
              Confirmar contraseña
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
            {loading ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
