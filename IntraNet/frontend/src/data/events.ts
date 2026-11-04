export type EventAttendee = {
  name: string
  status: 'confirmed' | 'pending'
}

export type EventoAgenda = {
  id: string
  titulo: string
  fecha: string
  date: string
  time: string
  location: string
  organizer: string
  fechaOrden: string
  importante: boolean
  reciente: boolean
  ciudad: string
  description: string
  attendees: EventAttendee[]
  color: string
}

export type FiltroAgenda = {
  id: string
  label: string
}

export const EVENTOS: EventoAgenda[] = [
  {
    id: '1',
    titulo: 'Reunión de Ventas',
    fecha: '28/12/2023',
    date: '28 de Diciembre',
    time: '14:00 - 15:30',
    location: 'Sala de Conferencias A',
    organizer: 'Gerencia de Ventas',
    fechaOrden: '2023-12-28',
    importante: true,
    reciente: false,
    ciudad: 'buenos-aires',
    description: 'Reunión trimestral de resultados y planificación del próximo período.',
    attendees: [
      { name: 'Juan Pérez', status: 'confirmed' },
      { name: 'María González', status: 'confirmed' },
      { name: 'Carlos López', status: 'pending' },
    ],
    color: '#3b82f6',
  },
  {
    id: '2',
    titulo: 'Capacitación RRHH',
    fecha: '15/05/2026',
    date: '15 de Mayo',
    time: '09:00 - 12:00',
    location: 'Auditorio Principal',
    organizer: 'Recursos Humanos',
    fechaOrden: '2026-05-15',
    importante: true,
    reciente: true,
    ciudad: 'mar-del-plata',
    description: 'Capacitación obligatoria sobre nuevas políticas de la empresa y beneficios.',
    attendees: [{ name: 'Todos los empleados', status: 'pending' }],
    color: '#8b5cf6',
  },
  {
    id: '3',
    titulo: 'After Office',
    fecha: '20/05/2026',
    date: '20 de Mayo',
    time: '18:00 - 20:00',
    location: 'Bar Downtown',
    organizer: 'Administración',
    fechaOrden: '2026-05-20',
    importante: false,
    reciente: true,
    ciudad: 'buenos-aires',
    description: 'Encuentro social del equipo para integración y entretenimiento.',
    attendees: [
      { name: 'Ana Rodríguez', status: 'confirmed' },
      { name: 'Pablo Martínez', status: 'confirmed' },
    ],
    color: '#ec4899',
  },
  {
    id: '4',
    titulo: 'Reunión sucursal MDP',
    fecha: '22/05/2026',
    date: '22 de Mayo',
    time: '10:30 - 11:30',
    location: 'Oficina Mar del Plata',
    organizer: 'Gerente Regional',
    fechaOrden: '2026-05-22',
    importante: false,
    reciente: true,
    ciudad: 'mar-del-plata',
    description: 'Sincronización con sucursal Mar del Plata sobre objetivos mensuales.',
    attendees: [
      { name: 'Director General', status: 'confirmed' },
      { name: 'Coordinador MDP', status: 'confirmed' },
    ],
    color: '#10b981',
  },
  {
    id: '5',
    titulo: 'Kickoff Q2',
    fecha: '10/04/2026',
    date: '10 de Abril',
    time: '15:00 - 17:00',
    location: 'Auditorio Principal',
    organizer: 'Dirección Ejecutiva',
    fechaOrden: '2026-04-10',
    importante: true,
    reciente: false,
    ciudad: 'buenos-aires',
    description: 'Lanzamiento de objetivos y metas para el segundo trimestre del año.',
    attendees: [{ name: 'Todos los líderes', status: 'confirmed' }],
    color: '#f59e0b',
  },
  {
    id: '6',
    titulo: 'Workshop producto',
    fecha: '18/05/2026',
    date: '18 de Mayo',
    time: '14:00 - 16:00',
    location: 'Sala de Innovación',
    organizer: 'Producto y Desarrollo',
    fechaOrden: '2026-05-18',
    importante: false,
    reciente: true,
    ciudad: 'buenos-aires',
    description: 'Taller sobre nuevas features y roadmap del producto.',
    attendees: [
      { name: 'Equipo Producto', status: 'confirmed' },
      { name: 'Equipo Desarrollo', status: 'confirmed' },
      { name: 'Stakeholders', status: 'pending' },
    ],
    color: '#06b6d4',
  },
]

export const FILTROS_AGENDA: FiltroAgenda[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'importantes', label: 'Importantes' },
  { id: 'recientes', label: 'Recientes' },
  { id: 'mar-del-plata', label: 'Mar del Plata' },
  { id: 'buenos-aires', label: 'Buenos Aires' },
]

// Gestiona la operacion filtrarEventos.
export function filtrarEventos(eventos: EventoAgenda[], filtroId: string): EventoAgenda[] {
  switch (filtroId) {
    case 'importantes':
      return eventos.filter((e) => e.importante)
    case 'recientes':
      return [...eventos]
        .filter((e) => e.reciente)
        .sort((a, b) => b.fechaOrden.localeCompare(a.fechaOrden))
    case 'mar-del-plata':
      return eventos.filter((e) => e.ciudad === 'mar-del-plata')
    case 'buenos-aires':
      return eventos.filter((e) => e.ciudad === 'buenos-aires')
    default:
      return eventos
  }
}
