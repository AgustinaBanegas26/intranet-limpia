import type { ReactNode } from 'react'
import { InstallAppButton } from '../components/InstallAppButton'
import { ThemeToggle } from '../components/ThemeToggle'

// Gestiona la operacion AuthLayout.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <InstallAppButton variant="secondary" />
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}
