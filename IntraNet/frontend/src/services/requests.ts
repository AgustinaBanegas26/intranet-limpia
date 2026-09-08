import { apiClient } from './apiClient'

export type SolicitudTipo = 'viaticos' | 'hotel' | 'auto' | 'anticipo' | 'adelanto' | 'rendicion_viaticos'
export type SolicitudEstado = 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'Pendiente' | 'Aprobado' | 'Rechazado'

export type SolicitudSolicitante = {
  id: number
  nombre: string
  email?: string | null
  area?: string | null
  sucursal?: string | null
  cargo?: string | null
  legajo?: string | null
}

export type SolicitudDTO = {
  id: string
  empleado_id: number
  tipo: SolicitudTipo
  estado: SolicitudEstado
  fecha_desde?: string | null
  fecha_hasta?: string | null
  destino?: string | null
  descripcion?: string | null
  monto_estimado?: number | null
  justificacion?: string | null
  comentario_admin?: string | null
  grupo_id?: string | null
  datos_extra?: Record<string, unknown>
  created_at?: string
  solicitante?: SolicitudSolicitante | null
}

export type CreateSolicitudPayload = {
  tipo: SolicitudTipo
  fecha_desde?: string
  fecha_hasta?: string
  destino?: string
  descripcion?: string
  monto_estimado?: number
  justificacion?: string
  datos_extra?: Record<string, unknown>
  // Nuevos campos de Viaticos
  nombre?: string
  email?: string
  area?: string
  motivo_solicitud?: string
  motivo_viaje?: string
  personas_viajan?: string
  medio_transporte?: string
  fecha_necesaria?: string
  fecha_finalizacion?: string
  monto_total?: number
  destino_viaticos?: string
  monto_solicitar?: number
  monto?: number
  observaciones?: string
  archivo_url?: string
}

export type CreateSolicitudesBody = CreateSolicitudPayload | { items: CreateSolicitudPayload[] }

export const requestsService = {
  getAll: async (estado?: string) => {
    const qs = estado && estado !== 'todos' ? `?estado=${encodeURIComponent(estado)}` : ''
    const [solicitudesRes, adelantosRes] = await Promise.all([
      apiClient.get<{ data: SolicitudDTO[] }>(`/solicitudes${qs}`),
      apiClient.get<{ data: Array<{ id: number; monto: number; empresa: string; estado: string; created_at?: string; empleado_id: number; solicitante?: { nombre?: string; area?: string; sucursal?: string; cargo?: string; legajo?: string } | null }> }>(`/adelantos${qs}`),
    ])

    const normalizedAdelantos = (adelantosRes.data || []).map((item) => ({
      id: `adelanto:${item.id}`,
      empleado_id: item.empleado_id,
      tipo: 'adelanto' as const,
      estado: (item.estado || 'pendiente') as SolicitudEstado,
      fecha_desde: item.created_at || null,
      fecha_hasta: null,
      destino: item.empresa || null,
      descripcion: `Adelanto de ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(item.monto || 0))}`,
      monto_estimado: Number(item.monto || 0),
      justificacion: null,
      comentario_admin: null,
      created_at: item.created_at,
      solicitante: item.solicitante ? {
        id: item.empleado_id,
        nombre: item.solicitante.nombre || 'Empleado',
        area: item.solicitante.area || null,
        sucursal: item.solicitante.sucursal || null,
        cargo: item.solicitante.cargo || null,
        legajo: item.solicitante.legajo || null,
      } : {
        id: item.empleado_id,
        nombre: 'Empleado',
        area: null,
        sucursal: null,
        cargo: null,
        legajo: null,
      },
    }))

    return { data: [...(solicitudesRes.data || []), ...normalizedAdelantos] }
  },

  create: (payload: CreateSolicitudesBody) =>
    apiClient.post<{ data: SolicitudDTO[] }>('/solicitudes', payload),

  createViaticos: (payload: CreateSolicitudPayload) =>
    apiClient.post<{ data: SolicitudDTO[] }>('/viaticos', payload),

  approve: async (id: number | string, comentario?: string) => {
    const idText = String(id)
    if (idText.startsWith('adelanto:')) {
      return apiClient.put<{ data: SolicitudDTO }>(`/adelantos/${idText.replace('adelanto:', '')}/approve`, { comentario: comentario || '' })
    }
    return apiClient.put<{ data: SolicitudDTO }>(`/solicitudes/${id}/approve`, { comentario: comentario || '' })
  },

  reject: async (id: number | string, comentario?: string) => {
    const idText = String(id)
    if (idText.startsWith('adelanto:')) {
      return apiClient.put<{ data: SolicitudDTO }>(`/adelantos/${idText.replace('adelanto:', '')}/reject`, { comentario: comentario || '' })
    }
    return apiClient.put<{ data: SolicitudDTO }>(`/solicitudes/${id}/reject`, { comentario: comentario || '' })
  },

  remove: async (id: number | string) => {
    const idText = String(id)
    if (idText.startsWith('adelanto:')) {
      return apiClient.delete<{ success: boolean }>(`/adelantos/${idText.replace('adelanto:', '')}`)
    }
    return apiClient.delete<{ success: boolean }>(`/solicitudes/${id}`)
  },
}
