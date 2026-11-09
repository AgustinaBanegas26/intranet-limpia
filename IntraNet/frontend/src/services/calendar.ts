// Servicio del frontend: encapsula las llamadas HTTP y transforma respuestas para que las pantallas no dependan del detalle de transporte. Tema específico: calendario y solicitudes asociadas.
import { apiClient } from './apiClient'
import type { CalendarRequestType } from '../config/calendarRequestTypes'

export type CalendarEvent = {
  id: string
  tipo: CalendarRequestType
  estado: 'aprobada'
  fecha_desde: string
  fecha_hasta: string
  empleado: string
  destino: string | null
  descripcion: string | null
  justificacion: string | null
  comentario_admin: string | null
  datos_extra: Record<string, unknown>
}

export const calendarService = {
  // Obtiene los datos necesarios.
  getEvents: () => apiClient.get<{ data: CalendarEvent[] }>('/calendario/solicitudes'),
}
