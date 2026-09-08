export type CalendarRequestType = 'ausencias' | 'vacaciones' | 'adelantos' | 'viaticos' | 'rendicion_viaticos' | 'hotel' | 'auto'

export const calendarRequestTypes: Record<CalendarRequestType, {
  label: string
  background: string
  color: string
  border: string
}> = {
  ausencias: {
    label: 'Ausencias',
    background: '#E8E3F8',
    color: '#62518F',
    border: '#CCC2EC',
  },
  vacaciones: {
    label: 'Vacaciones',
    background: '#E7DCF7',
    color: '#64458C',
    border: '#CCB5E8',
  },
  adelantos: {
    label: 'Adelantos',
    background: '#E3F3EC',
    color: '#3B7964',
    border: '#B8DECf',
  },
  viaticos: {
    label: 'Viáticos',
    background: '#FFE7C2',
    color: '#985B13',
    border: '#F5C77F',
  },
  rendicion_viaticos: {
    label: 'Rendición de viáticos',
    background: '#FCE5CB',
    color: '#9A5E24',
    border: '#F0C695',
  },
  hotel: {
    label: 'Hotel',
    background: '#DDF1FA',
    color: '#236B83',
    border: '#A9D8EA',
  },
  auto: {
    label: 'Auto',
    background: '#F8DDE8',
    color: '#8A3D5C',
    border: '#EAB5C9',
  },
}
