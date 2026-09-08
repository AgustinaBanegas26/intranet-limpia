import { getBackendUrl } from './auth'

export type Employee = {
  id: string | number
  legajo?: string | number | null
  nombre?: string | null
  apellido?: string | null
  email_corporativo?: string | null
  email_personal?: string | null
  cargo?: string | null
  area?: string | null
  sucursal?: string | null
  telefono?: string | null
  foto_url?: string | null
  activo?: boolean | null
  es_director?: boolean | null
  work_mode?: string | null
  fecha_nacimiento?: string | null
  fecha_ingreso?: string | null
}

export type Profile = {
  id?: string | number
  nombreCompleto?: string | null
  fechaNac?: string | null
  tel?: string | null
  celPersonal?: string | null
  emailEmpresa?: string | null
  emailPersonal?: string | null
  estadoCivil?: string | null
  domicilio?: string | null
  documento?: string | null
  hijos?: number | null
  cuil?: string | null
  sector?: string | null
  cargo?: string | null
  sucursal?: string | null
  foto?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

async function request<T>(path: string, token: string | null): Promise<T> {
  if (!token) {
    throw new Error('not_authenticated')
  }

  const res = await fetch(`${getBackendUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    let code = `http_${res.status}`
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) code = data.error
    } catch {
      // keep generic code
    }
    throw new Error(code)
  }

  return res.json() as Promise<T>
}

export async function getProfile(token: string | null) {
  return request<Profile>('/profile', token)
}

export async function getEmployees(token: string | null) {
  const payload = await request<{ data: Employee[] }>('/empleados', token)
  return payload.data || []
}

