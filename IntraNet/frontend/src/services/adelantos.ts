// Servicio del frontend: encapsula las llamadas HTTP y transforma respuestas para que las pantallas no dependan del detalle de transporte. Tema específico: solicitudes de adelantos.
import { apiClient } from './apiClient'

export type AdelantoEstado = 'pendiente' | 'aprobada' | 'rechazada'

export type AdelantoSolicitante = {
  id: number
  nombre: string
  email?: string | null
  area?: string | null
  sucursal?: string | null
  cargo?: string | null
  legajo?: string | null
  foto?: string | null
}

export type AdelantoDTO = {
  id: number
  empleado_id: number
  monto: number
  empresa: string
  estado: AdelantoEstado
  comentario_admin?: string | null
  resuelto_por?: number | null
  fecha_resolucion?: string | null
  created_at?: string
  updated_at?: string
  solicitante?: AdelantoSolicitante | null
}

export const adelantosService = {
  // Obtiene los datos necesarios.
  getAll: (filters?: { estado?: string; empleado?: string }) => {
    const params = new URLSearchParams()
    if (filters?.estado && filters.estado !== 'todos') params.set('estado', filters.estado)
    if (filters?.empleado) params.set('empleado', filters.empleado)
    const qs = params.toString()
    return apiClient.get<{ data: AdelantoDTO[] }>(`/adelantos${qs ? `?${qs}` : ''}`)
  },

  // Crea el registro o elemento correspondiente.
  create: (payload: { monto: number; empresa: string }) =>
    apiClient.post<{ data: AdelantoDTO }>('/adelantos', payload),

  // Gestiona la operacion approve.
  approve: (id: number | string, comentario?: string) =>
    apiClient.put<{ data: AdelantoDTO }>(`/adelantos/${id}/approve`, { comentario: comentario || '' }),

  // Gestiona la operacion reject.
  reject: (id: number | string, comentario?: string) =>
    apiClient.put<{ data: AdelantoDTO }>(`/adelantos/${id}/reject`, { comentario: comentario || '' }),

  // Elimina el elemento indicado.
  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/adelantos/${id}`),
}
