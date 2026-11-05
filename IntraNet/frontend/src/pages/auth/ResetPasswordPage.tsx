// Esta pantalla guía al empleado por solicitud, validación del código y cambio
// de contraseña. Se comunica sólo con el backend propio mediante passwordRecovery.
// App.tsx la publica en /reset-password mientras el usuario no inició sesión.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { ThemeToggle } from '../../components/ThemeToggle'
import { PasswordStrengthBar } from '../../components/ui/PasswordStrengthBar'
import {
  getPasswordRecoveryErrorMessage,
  requestPasswordRecovery,
  resetPasswordWithCode,
  verifyPasswordRecovery,
} from '../../services/passwordRecovery'

type RecoveryStep = 'request' | 'code' | 'password' | 'success'

// Dibuja la pantalla pública y conserva el avance entre pasos sólo en memoria;
// al recargar, el empleado puede volver a introducir correo y código.
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const initialEmail = new URLSearchParams(window.location.search).get('email') || ''
  const [step, setStep] = useState<RecoveryStep>(initialEmail ? 'code' : 'request')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  // Envía el correo y muestra la misma respuesta para cuentas existentes y no existentes.
  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const message = await requestPasswordRecovery(email.trim())
      setNotice(message)
      setStep('code')
    } catch (error) {
      setError(getPasswordRecoveryErrorMessage(
        error,
        'No se pudo procesar la solicitud ahora. Intentá nuevamente más tarde.',
      ))
    } finally {
      setLoading(false)
    }
  }

  // Pide al servidor comprobar el código antes de habilitar el formulario nuevo.
  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyPasswordRecovery(email.trim(), code.trim())
      setStep('password')
    } catch (error) {
      setError(getPasswordRecoveryErrorMessage(
        error,
        'El código no es válido, venció o alcanzó el máximo de intentos.',
      ))
    } finally {
      setLoading(false)
    }
  }

  // Comprueba coincidencia y reglas actuales; el servidor repite las validaciones
  // y calcula bcrypt antes de persistir la contraseña en empleados.password_hash.
  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError('La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.')
      return
    }

    setLoading(true)
    try {
      setNotice(await resetPasswordWithCode(email.trim(), code.trim(), password))
      setStep('success')
    } catch (error) {
      setError(getPasswordRecoveryErrorMessage(
        error,
        'No se pudo actualizar. El código puede haber vencido o ya haberse usado; solicitá otro.',
      ))
    } finally {
      setLoading(false)
    }
  }

  const heading = step === 'request'
    ? 'Recuperar contraseña'
    : step === 'code'
      ? 'Ingresar código'
      : step === 'password'
        ? 'Crear nueva contraseña'
        : 'Contraseña actualizada'

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
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--accent)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {step === 'success' ? <CheckCircle2 size={26} /> : <Lock size={26} />}
          </div>
        </div>

        <h1 className="auth-title">{heading}</h1>
        {error && <div className="auth-error" role="alert" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AlertCircle size={18} />{error}</div>}

        {step === 'request' && (
          <>
            <p className="auth-subtitle">Ingresá tu correo corporativo. Si la cuenta existe, te enviaremos un código temporal.</p>
            <form onSubmit={handleRequest} style={{ display: 'grid', gap: 14 }}>
              <div className="form-field">
                <label className="form-label" htmlFor="recovery-email">Email corporativo</label>
                <input id="recovery-email" className="form-input" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <button className="btn btn-lg btn-primary-fill btn-full" type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar código'}</button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="auth-subtitle">{notice || 'Ingresá el código enviado al correo corporativo.'}</p>
            <form onSubmit={handleVerify} style={{ display: 'grid', gap: 14 }}>
              <div className="form-field">
                <label className="form-label" htmlFor="recovery-code">Código de recuperación</label>
                <input id="recovery-code" className="form-input" inputMode="text" autoComplete="one-time-code" required value={code} onChange={(event) => setCode(event.target.value.trim())} aria-describedby="code-help" />
                <small id="code-help">El código vence a los 15 minutos.</small>
              </div>
              <button className="btn btn-lg btn-primary-fill btn-full" type="submit" disabled={loading}>{loading ? 'Verificando…' : 'Verificar código'}</button>
              <button className="btn btn-lg btn-outline btn-full" type="button" onClick={() => { setStep('request'); setNotice(''); setError('') }}>Solicitar otro código</button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <p className="auth-subtitle">Elegí una contraseña nueva para recuperar el acceso.</p>
            <form onSubmit={handleReset} style={{ display: 'grid', gap: 14 }}>
              <div className="form-field">
                <label className="form-label" htmlFor="new-password">Nueva contraseña</label>
                <input id="new-password" className="form-input" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} />
                <PasswordStrengthBar password={password} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="confirm-password">Confirmar contraseña</label>
                <input id="confirm-password" className="form-input" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
              </div>
              <button className="btn btn-lg btn-primary-fill btn-full" type="submit" disabled={loading}>{loading ? 'Actualizando…' : 'Guardar contraseña'}</button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div style={{ marginTop: 16 }}>
            <div className="auth-success" role="status" style={{ textAlign: 'center', padding: 16 }}>{notice}</div>
            <button className="btn btn-lg btn-primary-fill btn-full" style={{ marginTop: 24 }} type="button" onClick={() => navigate('/')}>Volver al inicio de sesión</button>
          </div>
        )}

        {step !== 'success' && (
          <button className="btn btn-lg btn-outline btn-full" style={{ marginTop: 14 }} type="button" onClick={() => navigate('/')}>Volver al inicio de sesión</button>
        )}
      </motion.div>
    </div>
  )
}
