// Servicio del frontend: encapsula las llamadas HTTP y transforma respuestas para que las pantallas no dependan del detalle de transporte. Tema específico: eventos institucionales.
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
  // Obtiene los datos necesarios.
  getAll: () => apiClient.get<{ data: EventoDTO[] }>('/eventos'),

  // Crea el registro o elemento correspondiente.
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

  // Actualiza los datos correspondientes.
  update: (id: number | string, payload: Partial<EventoDTO> & { sucursales_destino?: string[] }) =>
    apiClient.put<{ data: EventoDTO }>(`/eventos/${id}`, payload),

  // Elimina el elemento indicado.
  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/eventos/${id}`),

  // Gestiona la operacion rsvp.
  rsvp: (id: number | string) =>
    apiClient.post<{ data: { confirmado: boolean; asistentes: number } }>(`/eventos/${id}/rsvp`, {}),
}
