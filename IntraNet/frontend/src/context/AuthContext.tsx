import { createContext, useContext, type ReactNode } from 'react'

export type UserRole = 'empleado' | 'rrhh' | 'director' | 'admin'

export type User = {
  id?: string | number
  name: string
  email?: string
  role?: UserRole
  isPublisher?: boolean
  foto?: string | null
  mustChangePassword?: boolean
}

type AuthContextValue = {
  user: User
  token: string | null
  onLogout: () => void
  isAdmin: boolean
  isRRHH: boolean
  isDirector: boolean
  onPasswordChanged: (newToken?: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function isAdminUser(user: User) {
  return user.role === 'admin'
}

export function isRRHHUser(user: User) {
  return user.role === 'rrhh'
}

export function isDirectorUser(user: User) {
  return user.role === 'director'
}

export function canListEmployees(user: User) {
  return isAdminUser(user)
}

export function canPublishNovedades(user: User) {
  return isAdminUser(user)
}

export function normalizeRole(role?: string): UserRole {
  const r = String(role || '').toLowerCase()
  if (r === 'admin') return 'admin'
  if (r === 'rrhh') return 'rrhh'
  if (r === 'director') return 'director'
  if (r === 'employee' || r === 'empleado') return 'empleado'
  return 'empleado'
}

export function AuthProvider({
  user,
  token,
  onLogout,
  onPasswordChanged,
  children,
}: {
  user: User
  token: string | null
  onLogout: () => void
  onPasswordChanged: (newToken?: string) => void
  children: ReactNode
}) {
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        onLogout,
        isAdmin: isAdminUser(user),
        isRRHH: isRRHHUser(user),
        isDirector: isDirectorUser(user),
        onPasswordChanged,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}

export { getInitials } from '../utils/getInitials'
