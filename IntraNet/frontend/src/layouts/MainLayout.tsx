import { ProductShell } from '../components/ui/ProductUI'
import { isAdminUser, useAuth } from '../context/AuthContext'

export function MainLayout() {
  const { user } = useAuth()
  return <ProductShell mode={isAdminUser(user) ? 'admin' : 'employee'} />
}

