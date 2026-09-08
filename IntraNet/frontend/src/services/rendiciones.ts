import { apiClient } from './apiClient'
import type { SolicitudSolicitante } from './requests'

export type RendicionEstado = 'pendiente' | 'enviada' | 'devuelta' | 'aprobada'
export type RendicionMedioPago = 'efectivo' | 'tarjeta' | 'comprobante'

export type RendicionGastoDTO = {
  id: number
  rendicion_id: number
  fecha: string
  concepto: string
  observacion?: string | null
  medio_pago: RendicionMedioPago
  importe: number
  comprobante_url?: string | null
  comprobante_nombre?: string | null
  created_at?: string
  updated_at?: string
}

export type RendicionViaticoDTO = {
  id: number
  empleado_id: number
  estado: string
  fecha_inicio?: string | null
  fecha_finalizacion?: string | null
  fecha_necesaria?: string | null
  destino?: string | null
  motivo_viaje?: string | null
  motivo_solicitud?: string | null
  monto_total?: number | null
  nombre_completo?: string | null
  correo?: string | null
  area?: string | null
  solicitante?: SolicitudSolicitante | null
}

export type RendicionDTO = {
  id: number
  viatico_id: number
  empleado_id: number
  estado: RendicionEstado
  fecha_rendicion?: string
  fecha_habilitacion?: string
  fecha_envio?: string | null
  fecha_aprobacion?: string | null
  fecha_devolucion?: string | null
  enviado_por?: number | null
  aprobado_por?: number | null
  devuelto_por?: number | null
  motivo_devolucion?: string | null
  observaciones?: string | null
  monto_solicitado: number
  total_gastos: number
  total_efectivo: number
  total_tarjeta: number
  total_comprobantes: number
  diferencia: number
  habilitada_notificada_at?: string | null
  enviada_notificada_at?: string | null
  created_at?: string
  updated_at?: string
  viatico?: RendicionViaticoDTO | null
  gastos?: RendicionGastoDTO[]
}

export type RendicionGastoPayload = {
  fecha: string
  concepto: string
  observacion?: string
  medio_pago: RendicionMedioPago
  importe: number
  comprobante_url?: string
  comprobante_nombre?: string
}

export type RendicionUpdatePayload = {
  observaciones?: string
}

export type RendicionSendPayload = {
  observaciones?: string
}

export const rendicionesService = {
  getAll: async (estado?: string) => {
    const qs = estado && estado !== 'todos' ? `?estado=${encodeURIComponent(estado)}` : ''
    return apiClient.get<{ data: RendicionDTO[] }>(`/rendiciones${qs}`)
  },

  getById: async (id: number | string) =>
    apiClient.get<{ data: RendicionDTO }>(`/rendiciones/${id}`),

  getByViaticoId: async (viaticoId: number | string) =>
    apiClient.get<{ data: RendicionDTO }>(`/rendiciones/viatico/${viaticoId}`),

  update: async (id: number | string, payload: RendicionUpdatePayload) =>
    apiClient.put<{ data: RendicionDTO }>(`/rendiciones/${id}`, payload),

  addGasto: async (id: number | string, payload: RendicionGastoPayload) =>
    apiClient.post<{ data: RendicionDTO }>(`/rendiciones/${id}/gastos`, payload),

  updateGasto: async (id: number | string, gastoId: number | string, payload: RendicionGastoPayload) =>
    apiClient.put<{ data: RendicionDTO }>(`/rendiciones/${id}/gastos/${gastoId}`, payload),

  removeGasto: async (id: number | string, gastoId: number | string) =>
    apiClient.delete<{ success: boolean }>(`/rendiciones/${id}/gastos/${gastoId}`),

  send: async (id: number | string, payload: RendicionSendPayload = {}) =>
    apiClient.put<{ data: RendicionDTO }>(`/rendiciones/${id}/enviar`, payload),

  approve: async (id: number | string, comentario?: string) =>
    apiClient.put<{ data: RendicionDTO }>(`/rendiciones/${id}/aprobar`, { comentario: comentario || '' }),

  reject: async (id: number | string, comentario?: string) =>
    apiClient.put<{ data: RendicionDTO }>(`/rendiciones/${id}/devolver`, { comentario: comentario || '' }),
}
