import { apiClient } from './apiClient'

export type TechnicalSupplyStatus = 'pendiente' | 'aprobada' | 'rechazada'

export type TechnicalSupplyEmployee = {
  id: number | string
  nombre: string
  email?: string | null
  area?: string | null
  sucursal?: string | null
  cargo?: string | null
  legajo?: string | null
}

export type TechnicalSupplyRequestDTO = {
  id: number
  empleado_id: number
  email: string
  comment: string
  amount: number
  status: TechnicalSupplyStatus
  approved: boolean
  admin_comment?: string | null
  resolved_by?: number | null
  resolved_at?: string | null
  created_at?: string
  updated_at?: string
  solicitante?: TechnicalSupplyEmployee | null
}

export const technicalSuppliesService = {
  getRequests: (filters?: { estado?: string }) => {
    const params = new URLSearchParams()
    if (filters?.estado && filters.estado !== 'todos') params.set('estado', filters.estado)
    const qs = params.toString()
    return apiClient.get<{ data: TechnicalSupplyRequestDTO[] }>(`/insumos-tecnicos/solicitudes${qs ? `?${qs}` : ''}`)
  },

  createRequest: (payload: { comment: string; amount: number }) =>
    apiClient.post<{ data: TechnicalSupplyRequestDTO }>('/insumos-tecnicos/solicitudes', payload),

  updateRequest: (id: number | string, payload: { comment: string; amount: number; email?: string }) =>
    apiClient.put<{ data: TechnicalSupplyRequestDTO }>(`/insumos-tecnicos/solicitudes/${id}`, payload),

  upsertFicha: (empleadoId: number | string, payload: { email: string; comment: string; amount: number }) =>
    apiClient.put<{ data: TechnicalSupplyRequestDTO }>(`/insumos-tecnicos/fichas/${empleadoId}`, payload),

  approveRequest: (id: number | string, comentario?: string) =>
    apiClient.put<{ data: TechnicalSupplyRequestDTO }>(`/insumos-tecnicos/solicitudes/${id}/approve`, { comentario: comentario || '' }),

  rejectRequest: (id: number | string, comentario?: string) =>
    apiClient.put<{ data: TechnicalSupplyRequestDTO }>(`/insumos-tecnicos/solicitudes/${id}/reject`, { comentario: comentario || '' }),
}
