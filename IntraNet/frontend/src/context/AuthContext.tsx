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

// Comprueba si el usuario tiene rol de administrador.
export function isAdminUser(user: User) {
  return user.role === 'admin'
}

// Comprueba si el usuario tiene rol de Recursos Humanos.
export function isRRHHUser(user: User) {
  return user.role === 'rrhh'
}

// Comprueba si el usuario tiene rol de director.
export function isDirectorUser(user: User) {
  return user.role === 'director'
}

// Comprueba si el usuario puede consultar la lista de empleados.
export function canListEmployees(user: User) {
  return isAdminUser(user)
}

// Comprueba si el usuario puede publicar novedades.
export function canPublishNovedades(user: User) {
  return isAdminUser(user)
}

// Convierte cualquier valor de rol a uno de los roles admitidos.
export function normalizeRole(role?: string): UserRole {
  const r = String(role || '').toLowerCase()
  if (r === 'admin') return 'admin'
  if (r === 'rrhh') return 'rrhh'
  if (r === 'director') return 'director'
  if (r === 'employee' || r === 'empleado') return 'empleado'
  return 'empleado'
}

// Comparte los datos de sesión con los componentes autenticados.
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

// Devuelve la sesión actual o informa si falta el proveedor.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}

export { getInitials } from '../utils/getInitials'
