import { useState } from 'react'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../services/auth'

// Actualiza los datos correspondientes.
export default function ChangePassword() {
  const { user, onPasswordChanged } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

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
      await changePassword({ password })
      setSuccess('Contraseña actualizada correctamente.')
      onPasswordChanged()
    } catch (err) {
      setError('No se pudo actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-card p-8 rounded-3xl shadow-card border border-border"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">Cambiar contraseña</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Hola {user.name}. Por seguridad, debés definir una contraseña personal antes de usar la
          intranet.
        </p>

        {error && (
          <p className="text-sm text-primary bg-accent px-4 py-2 rounded-2xl mb-4">{error}</p>
        )}
        {success && (
          <p className="text-sm text-foreground bg-emerald-100 px-4 py-2 rounded-2xl mb-4">{success}</p>
        )}

        <label className="block mb-4">
          <span className="text-sm font-medium text-foreground">Nueva contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-2 w-full bg-input-background border border-border rounded-full px-5 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-medium text-foreground">Confirmar contraseña</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="mt-2 w-full bg-input-background border border-border rounded-full px-5 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:opacity-90 transition-all disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </form>
    </div>
  )
}
