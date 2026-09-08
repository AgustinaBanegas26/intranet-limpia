import { apiClient } from './apiClient'

export type AusenciaDTO = {
  id: number
  empleado_id: number
  tipo: string
  fecha_desde: string
  fecha_hasta: string
  hora_desde?: string | null
  hora_hasta?: string | null
  motivo: string
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  dias?: number
  created_at?: string
  archivo_url?: string | null
  archivo_nombre?: string | null
  solicitante?: {
    id: number
    nombre: string
    email?: string | null
    area?: string | null
    sucursal?: string | null
    cargo?: string | null
    legajo?: string | null
    foto?: string | null
  } | null
}

export type AusenciaFilters = {
  estado?: string
  tipo?: string
  area?: string
  sucursal?: string
  empleado?: string
  vigente?: boolean
}

function buildQuery(filters?: AusenciaFilters) {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.estado && filters.estado !== 'todos') params.set('estado', filters.estado)
  if (filters.tipo) params.set('tipo', filters.tipo)
  if (filters.area) params.set('area', filters.area)
  if (filters.sucursal) params.set('sucursal', filters.sucursal)
  if (filters.empleado) params.set('empleado', filters.empleado)
  if (filters.vigente) params.set('vigente', 'true')
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const absencesService = {
  getAll: (filters?: AusenciaFilters | string) => {
    const resolved =
      typeof filters === 'string'
        ? { estado: filters }
        : filters
    return apiClient.get<{ data: AusenciaDTO[] }>(`/ausencias${buildQuery(resolved)}`)
  },

  getVigentes: () =>
    apiClient.get<{ data: AusenciaDTO[] }>('/ausencias?estado=aprobada&vigente=true'),

  create: (payload: { tipo: string; fecha_desde?: string; fecha_hasta?: string; hora_desde?: string; hora_hasta?: string; motivo: string }) =>
    apiClient.post<{ data: AusenciaDTO }>('/ausencias', payload),

  approve: (id: number | string, comentario?: string) =>
    apiClient.put<{ data: AusenciaDTO }>(`/ausencias/${id}/approve`, { comentario: comentario || '' }),

  reject: (id: number | string, comentario?: string) =>
    apiClient.put<{ data: AusenciaDTO }>(`/ausencias/${id}/reject`, { comentario: comentario || '' }),

  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/ausencias/${id}`),

  update: (id: number | string, payload: { tipo?: string; fecha_desde?: string; fecha_hasta?: string; motivo?: string }) =>
    apiClient.put<{ data: AusenciaDTO }>(`/ausencias/${id}`, payload),
}
