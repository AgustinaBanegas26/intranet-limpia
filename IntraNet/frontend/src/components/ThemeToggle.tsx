import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

type ThemeToggleProps = {
  className?: string
}

// Gestiona la operacion ThemeToggle.
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
      className={`p-2 rounded-full transition-all hover:bg-muted text-muted-foreground hover:text-foreground ${className}`}
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  )
}
