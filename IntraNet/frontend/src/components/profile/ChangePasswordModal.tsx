// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: cambio de contraseña.
import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, X } from 'lucide-react'
import { changePassword } from '../../services/auth'
import { ModalBackdrop } from '../ui/ModalBackdrop'
import { useAuth } from '../../context/AuthContext'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_password: 'La contraseña debe tener al menos 8 caracteres.',
  current_password_required: 'Debés ingresar tu contraseña actual.',
  invalid_current_password: 'La contraseña actual no es correcta.',
  same_password: 'La nueva contraseña debe ser distinta a la actual.',
  failed_to_change_password: 'No se pudo actualizar la contraseña.',
  not_authenticated: 'Tu sesión expiró. Volvé a iniciar sesión.',
}

type Props = {
  open: boolean
  onClose: () => void
}

// Actualiza los datos correspondientes.
export function ChangePasswordModal({ open, onClose }: Props) {
  const { onPasswordChanged } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!open) return null

  // Limpia el estado o los datos correspondientes.
  const reset = () => {
    setCurrentPassword('')
    setPassword('')
    setConfirm('')
    setError('')
    setSuccess('')
  }

  // Gestiona la accion correspondiente.
  const handleClose = () => {
    reset()
    onClose()
  }

  // Gestiona la accion correspondiente.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword.trim()) {
      setError('Debés ingresar tu contraseña actual.')
      return
    }
    if (password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (currentPassword === password) {
      setError('La nueva contraseña debe ser distinta a la actual.')
      return
    }

    setLoading(true)
    try {
      const result = await changePassword({ password, currentPassword })
      setSuccess('Contraseña actualizada correctamente.')
      onPasswordChanged(result.token)
      setTimeout(handleClose, 1200)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'failed_to_change_password'
      setError(ERROR_MESSAGES[code] || ERROR_MESSAGES.failed_to_change_password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalBackdrop role="dialog" aria-modal="true">
      <div className="profile-modal">
        <div className="modal-head">
          <div>
            <p className="page-kicker">Seguridad</p>
            <h3><LockKeyhole size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} />Cambiar contraseña</h3>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={handleClose}><X size={18} /></button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <label className="form-field">
            <span className="form-label">Contraseña actual</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 48 }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowCurrent((v) => !v)} aria-label="Mostrar contraseña">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="form-field">
            <span className="form-label">Nueva contraseña</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                style={{ paddingRight: 48 }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPass((v) => !v)} aria-label="Mostrar contraseña">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="form-field">
            <span className="form-label">Confirmar nueva contraseña</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                className="form-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: 48 }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm((v) => !v)} aria-label="Mostrar contraseña">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-md btn-ghost" onClick={handleClose}>Cancelar</button>
            <button type="submit" className="btn btn-md btn-primary-fill" disabled={loading}>
              {loading ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}
