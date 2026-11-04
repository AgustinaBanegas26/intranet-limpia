import { apiClient } from './apiClient'

export type NotificacionDTO = {
  id: number | string
  titulo: string
  mensaje: string
  leida: boolean
  fecha?: string
  tipo?: string
}

const TIPO_LABELS: Record<string, string> = {
  novedad: 'Novedad',
  ausencia: 'Ausencia',
  hotel: 'Hotel',
  auto: 'Auto',
  viaticos: 'Viáticos',
  rendicion_viaticos: 'Rendición de Viáticos',
  adelanto: 'Adelanto',
  insumos: 'Insumos Técnicos',
  solicitud: 'Solicitud',
  evento: 'Evento',
  politica: 'Política',
  general: 'General',
}

// Obtiene los datos necesarios.
export function getNotificationTypeLabel(tipo?: string) {
  if (!tipo) return 'General'
  return TIPO_LABELS[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1)
}

// Gestiona la operacion notificationText.
function notificationText(item: NotificacionDTO) {
  return `${item.titulo || ''} ${item.mensaje || ''}`.toLowerCase()
}

// Gestiona la operacion matchesRendicion.
function matchesRendicion(text: string, tipo?: string) {
  return tipo === 'rendicion_viaticos' || text.includes('rendición') || text.includes('rendicion')
}

// Gestiona la operacion matchesViatico.
function matchesViatico(text: string, tipo?: string) {
  if (matchesRendicion(text, tipo)) return false
  return tipo === 'viaticos' || text.includes('viático') || text.includes('viatico')
}

// Gestiona la operacion matchesHotel.
function matchesHotel(text: string, tipo?: string) {
  return tipo === 'hotel' || text.includes('hotel')
}

// Gestiona la operacion matchesAuto.
function matchesAuto(text: string, tipo?: string) {
  if (matchesViatico(text, tipo) || matchesRendicion(text, tipo)) return false
  return tipo === 'auto' || text.includes(' auto') || text.startsWith('auto') || text.includes('vehículo') || text.includes('vehiculo')
}

// Gestiona la operacion matchesAdelanto.
function matchesAdelanto(text: string, tipo?: string) {
  return tipo === 'adelanto' || text.includes('adelanto')
}

// Gestiona la operacion matchesVacacion.
function matchesVacacion(text: string) {
  return text.includes('vacacion')
}

// Gestiona la operacion matchesAusencia.
function matchesAusencia(text: string, tipo?: string) {
  return tipo === 'ausencia' || text.includes('ausencia') || text.includes('licencia')
}

// Gestiona la operacion matchesInsumos.
function matchesInsumos(text: string, tipo?: string) {
  return tipo === 'insumos' || text.includes('insumo')
}

/**
 * Fuente única de rutas para "Abrir módulo" en notificaciones.
 */
export function getNotificationModulePath(item: NotificacionDTO, isAdmin: boolean): string {
  const text = notificationText(item)
  const tipo = item.tipo || ''
  const titulo = (item.titulo || '').toLowerCase()

  if (tipo === 'novedad' || text.includes('novedad') || text.includes('comunicado')) {
    return '/novedades'
  }
  if (tipo === 'evento' || text.includes('evento') || text.includes('reunion') || text.includes('reunión')) {
    return '/eventos'
  }
  if (tipo === 'politica' || text.includes('política') || text.includes('politica')) {
    return '/politicas'
  }

  if (matchesInsumos(text, tipo)) {
    return '/insumos-tecnicos'
  }

  if (matchesAdelanto(text, tipo)) {
    return '/adelantos'
  }

  if (matchesVacacion(text)) {
    return isAdmin ? '/ausencias' : '/vacaciones'
  }

  if (matchesAusencia(text, tipo)) {
    return '/ausencias'
  }

  if (matchesRendicion(text, tipo)) {
    return isAdmin ? '/solicitudes' : '/viaticos?tab=rendiciones'
  }

  if (matchesViatico(text, tipo)) {
    return isAdmin ? '/solicitudes' : '/viaticos'
  }

  if (matchesHotel(text, tipo)) {
    return isAdmin ? '/solicitudes' : '/reservas'
  }

  if (matchesAuto(text, tipo)) {
    return isAdmin ? '/solicitudes' : '/solicitar'
  }

  if (text.includes('anticipo') || tipo === 'solicitud') {
    return isAdmin ? '/solicitudes' : '/solicitar'
  }

  if (isAdmin && (titulo.startsWith('nueva solicitud') || titulo.startsWith('nuevas solicitudes'))) {
    if (matchesInsumos(text, tipo)) return '/insumos-tecnicos'
    return '/solicitudes'
  }

  if (isAdmin && titulo.startsWith('nueva ausencia')) {
    return '/ausencias'
  }

  return '/novedades'
}

export const notificationsService = {
  // Obtiene los datos necesarios.
  getAll: () => apiClient.get<{ data: NotificacionDTO[] }>('/notificaciones'),

  // Gestiona la operacion markRead.
  markRead: (id: number | string) =>
    apiClient.put<{ success: boolean }>(`/notificaciones/${id}/leer`, {}),

  // Gestiona la operacion markAllRead.
  markAllRead: () =>
    apiClient.put<{ success: boolean }>('/notificaciones/leer-todas', {}),

  // Elimina el elemento indicado.
  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/notificaciones/${id}`),

  // Elimina el elemento indicado.
  removeAll: () =>
    apiClient.delete<{ success: boolean }>(`/notificaciones/todas`),
}
