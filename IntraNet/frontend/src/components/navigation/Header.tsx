import { useState } from 'react'
import { Search, Bell } from 'lucide-react'
import { InstallAppButton } from '../InstallAppButton'
import { ThemeToggle } from '../ThemeToggle'
import { useAuth } from '../../context/AuthContext'

const notifications = [
  { id: 1, title: 'Nueva política de vacaciones', description: 'Revisá el documento antes del viernes.' },
  { id: 2, title: 'Recordatorio de reunión general', description: 'Jueves 16:00 en sala principal.' },
  { id: 3, title: 'Actualización de beneficios', description: 'Se agregó un nuevo convenio de salud.' },
  { id: 4, title: 'Solicitud pendiente', description: 'Tu aprobación de reservas está pendiente.' },
  { id: 5, title: 'Cambio de horario', description: 'RRHH publicó un nuevo horario de verano.' },
]

// Gestiona la operacion NotificationsModal.
function NotificationsModal({
  isOpen,
  onClose,
  userName,
}: {
  isOpen: boolean
  onClose: () => void
  userName: string
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Notificaciones pendientes"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Notificaciones</p>
            <h2 className="text-xl font-bold text-foreground">Pendientes para {userName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar notificaciones"
          >
            Cerrar
          </button>
        </div>

        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div key={n.id} className="px-6 py-4">
              <h3 className="text-base font-semibold text-foreground">{n.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

// Gestiona la operacion Header.
export function Header() {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <>
      <header className="bg-card border-b border-border px-8 py-4 flex items-center gap-4 sticky top-0 z-10 transition-colors">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar en la intranet..."
              className="w-full bg-input-background border border-border rounded-full pl-12 pr-6 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <InstallAppButton variant="ghost" />
          <ThemeToggle />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="p-2 hover:bg-muted rounded-full transition-all"
              aria-label="Abrir notificaciones"
              aria-haspopup="dialog"
              aria-expanded={showNotifications}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
              {notifications.length}
            </span>
          </div>
        </div>
      </header>

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        userName={user.name}
      />
    </>
  )
}
