import { usePwaInstall } from '../context/PwaInstallContext'

type InstallAppButtonProps = {
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  showLabel?: boolean
}

const variantClasses = {
  primary:
    'bg-primary text-primary-foreground hover:opacity-90 border border-transparent',
  secondary:
    'bg-muted text-foreground hover:bg-muted/80 border border-border',
  ghost:
    'bg-transparent text-foreground hover:bg-muted border border-border',
}

// Gestiona la operacion InstallAppButton.
export function InstallAppButton({
  className = '',
  variant = 'primary',
  showLabel = true,
}: InstallAppButtonProps) {
  const { canInstall, isInstalled, install } = usePwaInstall()

  if (isInstalled || !canInstall) {
    return null
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${variantClasses[variant]} ${className}`}
      aria-label="Instalar aplicación"
    >
      <img
        src="/icons/icon-72x72.png"
        alt=""
        aria-hidden="true"
        className="h-5 w-5 shrink-0 rounded-md"
      />
      {showLabel && <span>Instalar aplicación</span>}
    </button>
  )
}
