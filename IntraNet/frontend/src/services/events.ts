import { apiClient } from './apiClient'

export type EventoDTO = {
  id: number
  titulo: string
  descripcion?: string | null
  fecha_inicio: string
  fecha_fin?: string | null
  lugar?: string | null
  imagen_url?: string | null
  pdf_url?: string | null
  creado_por?: number | null
  created_at?: string
  asistentes?: number
  confirmado?: boolean
  activo?: boolean
  sucursalesDestino?: string[] | null
}

export const eventsService = {
  getAll: () => apiClient.get<{ data: EventoDTO[] }>('/eventos'),

  create: (payload: {
    titulo: string
    descripcion?: string
    fecha_inicio: string
    fecha_fin?: string
    lugar?: string
    imagen_url?: string
    pdf_url?: string
    sucursales_destino?: string[]
  }) => apiClient.post<{ data: EventoDTO }>('/eventos', payload),

  update: (id: number | string, payload: Partial<EventoDTO> & { sucursales_destino?: string[] }) =>
    apiClient.put<{ data: EventoDTO }>(`/eventos/${id}`, payload),

  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/eventos/${id}`),

  rsvp: (id: number | string) =>
    apiClient.post<{ data: { confirmado: boolean; asistentes: number } }>(`/eventos/${id}/rsvp`, {}),
}
