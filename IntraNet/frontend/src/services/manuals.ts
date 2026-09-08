import { apiClient } from './apiClient'

export type ManualDTO = {
  id: number
  titulo: string
  descripcion?: string | null
  categoria?: string | null
  archivo_url?: string | null
  version?: string | null
  paginas?: number | null
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export const manualsService = {
  getAll: () => apiClient.get<{ data: ManualDTO[] }>('/manuales'),

  create: (payload: {
    titulo: string
    descripcion?: string
    categoria?: string
    archivo_url?: string
    version?: string
    paginas?: number
  }) => apiClient.post<{ data: ManualDTO }>('/manuales', payload),

  update: (id: number | string, payload: Partial<ManualDTO>) =>
    apiClient.put<{ data: ManualDTO }>(`/manuales/${id}`, payload),

  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/manuales/${id}`),
}
