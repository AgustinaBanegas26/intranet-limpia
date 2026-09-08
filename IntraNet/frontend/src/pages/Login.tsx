import { useState } from 'react'
import { AlertCircle, ArrowRight, CalendarDays, LockKeyhole, Newspaper, ShieldCheck } from 'lucide-react'
import { InstallAppButton } from '../components/InstallAppButton'
import { login, type Session } from '../services/auth'
import { useTheme } from '../context/ThemeContext'
import logoLoginDark from '../assets/logo sesion negro.png'
import logoLoginLight from '../assets/icono-rojo.png'
import logoFormLight from '../assets/icono-rojo-solo logo.png'

interface Props {
  onLogin: (session: Session) => void
}

function formatError(code: string) {
  if (code === 'invalid_credentials') return 'Correo o contraseña incorrectos.'
  if (code === 'auth_locked') return 'Cuenta bloqueada. Probá más tarde.'
  if (code === 'account_disabled') return 'Cuenta deshabilitada. Contactá a soporte.'
  if (code === 'Failed to fetch') return 'No se puede conectar al servidor.'
  if (code === 'login_failed') return 'No se pudo conectar con el backend.'
  return 'No se pudo iniciar sesión.'
}

const Login = ({ onLogin }: Props) => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const data = new FormData(form)
    const email = String(data.get('email') || '').trim()
    const password = String(data.get('password') || '')
    if (!email || !password) return

    setError('')
    setLoading(true)
    try {
      const session = await login({ email, password })
      onLogin({
        token: session.token,
        user: { ...session.user, mustChangePassword: Boolean(session.user.mustChangePassword) },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'login_failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="premium-login">
      <section className="login-intel">
        <img src={theme === 'dark' ? logoLoginDark : logoLoginLight} alt="Grupo Núcleo" className="login-brand" />
        <div>
          <p className="login-kicker">Portal corporativo</p>
          <h1>Una intranet más segura, simple y conectada.</h1>
          <p>Accedé a novedades, solicitudes, beneficios y documentación interna desde una experiencia unificada.</p>
        </div>
        <div className="login-insights">
          <article><Newspaper size={18} /><span>Comunicados internos y agenda corporativa</span></article>
          <article><CalendarDays size={18} /><span>Eventos, reservas y solicitudes en seguimiento</span></article>
          <article><ShieldCheck size={18} /><span>Acceso protegido para empleados de Grupo Núcleo</span></article>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-tools">
          <InstallAppButton variant="ghost" />
        </div>
        <form onSubmit={handleSubmit} className="login-card">
          <div className="login-card-logo">
            <img src={logoFormLight} alt="Grupo Núcleo" />
          </div>
          <div className="login-card-head">
            <p className="login-kicker">Acceso seguro</p>
            <h2>Iniciar sesión</h2>
            <span>Ingresá con tu email corporativo y contraseña.</span>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={17} />
              {formatError(error)}
            </div>
          )}

          <label className="login-field">
            <span>Email corporativo</span>
            <input name="email" type="text" placeholder="nombre@gruponucleo.com.ar" required />
          </label>
          <label className="login-field">
            <span>Contraseña</span>
            <input name="password" type="password" required />
          </label>

          <button type="submit" disabled={loading} className="login-submit">
            {loading ? <span className="spinner" /> : <LockKeyhole size={18} />}
            {loading ? 'Ingresando...' : 'Entrar al portal'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
