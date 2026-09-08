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

export function getNotificationTypeLabel(tipo?: string) {
  if (!tipo) return 'General'
  return TIPO_LABELS[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1)
}

function notificationText(item: NotificacionDTO) {
  return `${item.titulo || ''} ${item.mensaje || ''}`.toLowerCase()
}

function matchesRendicion(text: string, tipo?: string) {
  return tipo === 'rendicion_viaticos' || text.includes('rendición') || text.includes('rendicion')
}

function matchesViatico(text: string, tipo?: string) {
  if (matchesRendicion(text, tipo)) return false
  return tipo === 'viaticos' || text.includes('viático') || text.includes('viatico')
}

function matchesHotel(text: string, tipo?: string) {
  return tipo === 'hotel' || text.includes('hotel')
}

function matchesAuto(text: string, tipo?: string) {
  if (matchesViatico(text, tipo) || matchesRendicion(text, tipo)) return false
  return tipo === 'auto' || text.includes(' auto') || text.startsWith('auto') || text.includes('vehículo') || text.includes('vehiculo')
}

function matchesAdelanto(text: string, tipo?: string) {
  return tipo === 'adelanto' || text.includes('adelanto')
}

function matchesVacacion(text: string) {
  return text.includes('vacacion')
}

function matchesAusencia(text: string, tipo?: string) {
  return tipo === 'ausencia' || text.includes('ausencia') || text.includes('licencia')
}

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
  getAll: () => apiClient.get<{ data: NotificacionDTO[] }>('/notificaciones'),

  markRead: (id: number | string) =>
    apiClient.put<{ success: boolean }>(`/notificaciones/${id}/leer`, {}),

  markAllRead: () =>
    apiClient.put<{ success: boolean }>('/notificaciones/leer-todas', {}),

  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/notificaciones/${id}`),

  removeAll: () =>
    apiClient.delete<{ success: boolean }>(`/notificaciones/todas`),
}
