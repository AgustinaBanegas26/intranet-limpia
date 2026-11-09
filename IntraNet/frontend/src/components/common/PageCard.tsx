// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: tarjeta visual reutilizable.
import type { ReactNode } from 'react'

type PageCardProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

// Gestiona la operacion PageCard.
export function PageCard({ title, description, action, children }: PageCardProps) {
  return (
    <div className="bg-card rounded-[2rem] p-6 md:p-8 shadow-card border border-border">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}
