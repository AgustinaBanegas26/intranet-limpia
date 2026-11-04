import { apiClient } from './apiClient'

export type MensajeDTO = {
  id: number
  remitente_id: number
  destinatario_id: number
  from: string
  to: string
  subject: string
  body: string
  date: string
  read: boolean
  folder: 'inbox' | 'sent'
}

export type ContactoDTO = {
  id: number
  nombre: string
  email?: string | null
  area?: string | null
  role?: string | null
}

export const messagesService = {
  // Obtiene los datos necesarios.
  getContactos: () => apiClient.get<{ data: ContactoDTO[] }>('/mensajes/contactos'),

  // Obtiene los datos necesarios.
  getAll: (carpeta: 'inbox' | 'sent' = 'inbox') =>
    apiClient.get<{ data: MensajeDTO[] }>(`/mensajes?carpeta=${carpeta}`),

  // Crea el registro o elemento correspondiente.
  create: (payload: { destinatario_id: number; asunto?: string; cuerpo: string }) =>
    apiClient.post<{ data: MensajeDTO }>('/mensajes', payload),

  // Gestiona la operacion markRead.
  markRead: (id: number | string) =>
    apiClient.put<{ success: boolean }>(`/mensajes/${id}/leer`, {}),

  // Elimina el elemento indicado.
  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/mensajes/${id}`),
}
