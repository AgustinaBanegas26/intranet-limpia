// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: QuickMetricsBar.
import type { LucideIcon } from 'lucide-react'

export type QuickMetric = {
  icon: LucideIcon
  label: string
  value: number
}

type QuickMetricsBarProps = {
  metrics: QuickMetric[]
  className?: string
}

// Gestiona la operacion QuickMetricsBar.
export function QuickMetricsBar({ metrics, className = '' }: QuickMetricsBarProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-card rounded-3xl p-4 flex items-center gap-3 shadow-sm border border-border hover:shadow-md transition-shadow"
        >
          <div className="bg-accent w-11 h-11 rounded-full flex items-center justify-center shrink-0">
            <metric.icon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
            <p className="text-xl font-bold text-primary">{metric.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
