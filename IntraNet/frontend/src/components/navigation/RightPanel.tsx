import { Link } from 'react-router'

const quickTopics = [
  { label: 'Vacaciones', path: '/vacaciones', emoji: '🌴' },
  { label: 'Reservas', path: '/solicitar', emoji: '🚗' },
  { label: 'Beneficios', path: '/beneficios', emoji: '🎁' },
  { label: 'Eventos', path: '/eventos', emoji: '📅' },
  { label: 'Políticas', path: '/politicas', emoji: '📋' },
]

export function RightPanel() {
  return (
    <aside className="w-[280px] shrink-0 space-y-4 hidden xl:block">
      <div className="bg-card rounded-3xl p-4 shadow-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-sm">Accesos rápidos</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickTopics.map((topic) => (
            <Link
              key={topic.path + topic.label}
              to={topic.path}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-muted hover:bg-accent transition-all text-center min-h-[72px]"
            >
              <span className="text-xl">{topic.emoji}</span>
              <span className="text-[11px] font-medium text-foreground leading-tight">
                {topic.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary to-[var(--primary-gradient-end)] rounded-3xl p-4 text-primary-foreground shadow-card">
        <p className="text-xs opacity-90 mb-1">Próximo evento</p>
        <p className="font-bold text-sm">Reunión general</p>
        <p className="text-xs opacity-90 mt-1">Viernes 16:00 · Sala principal</p>
        <Link
          to="/eventos"
          className="mt-3 block text-center text-xs font-medium bg-white/20 hover:bg-white/30 py-2 rounded-full transition-all"
        >
          Ver agenda
        </Link>
      </div>
    </aside>
  )
}
