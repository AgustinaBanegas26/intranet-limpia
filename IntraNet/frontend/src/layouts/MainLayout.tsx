// Estructura visual común: envuelve páginas con navegación, encabezados y áreas compartidas. Tema específico: punto de entrada del cliente.
import { ProductShell } from '../components/ui/ProductUI'
import { isAdminUser, useAuth } from '../context/AuthContext'

// Gestiona la operacion MainLayout.
export function MainLayout() {
  const { user } = useAuth()
  return <ProductShell mode={isAdminUser(user) ? 'admin' : 'employee'} />
}

