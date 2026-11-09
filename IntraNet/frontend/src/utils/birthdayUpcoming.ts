// Utilidad del frontend: contiene funciones puras o validaciones compartidas, separadas de la presentación. Tema específico: birthdayUpcoming.
import type { CelebracionPersona, CelebracionesDTO } from '../services/celebraciones'

export type BirthdayUpcomingDisplay = {
  person: CelebracionPersona
  fechaLabel: string
  diaSemana: string | null
  diasLabel: string
  isToday: boolean
}

// Gestiona la operacion startOfDay.
function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Gestiona la operacion daysUntilEndOfMonth.
export function daysUntilEndOfMonth(from = new Date()): number {
  const today = startOfDay(from)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return Math.round((end.getTime() - today.getTime()) / 86_400_000)
}

// Comprueba los datos o la condicion indicada.
export function isBirthdayToday(person: CelebracionPersona): boolean {
  return person.esHoy === true || person.diasRestantes === 0
}

// Comprueba los datos o la condicion indicada.
export function isBirthdayPast(person: CelebracionPersona): boolean {
  const days = person.diasRestantes
  return days != null && days < 0
}

/** Devuelve los cumpleaños que quedan en el mes actual, sin incluir los de hoy ni los pasados. */
export function filterMonthlyUpcoming(persons: CelebracionPersona[]): CelebracionPersona[] {
  const maxDays = daysUntilEndOfMonth()
  return persons.filter((p) => {
    if (isBirthdayToday(p)) return false
    if (isBirthdayPast(p)) return false
    const days = p.diasRestantes
    if (days == null) return true
    return days <= maxDays
  })
}

// Procesa los elementos de la coleccion.
export function sortByUpcomingDate(persons: CelebracionPersona[]): CelebracionPersona[] {
  return [...persons].sort((a, b) => {
    const da = a.diasRestantes ?? Number.MAX_SAFE_INTEGER
    const db = b.diasRestantes ?? Number.MAX_SAFE_INTEGER
    return da - db
  })
}

// Gestiona la operacion resolveBirthdayDate.
function resolveBirthdayDate(person: CelebracionPersona): Date | null {
  const days = person.diasRestantes
  if (days != null && days >= 0) {
    const d = startOfDay(new Date())
    d.setDate(d.getDate() + days)
    return d
  }
  if (person.fecha && person.fecha !== 'Hoy') {
    const parsed = new Date(person.fecha)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return null
}

// Prepara el valor para su uso.
function formatFechaLabel(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleDateString('es-AR', { month: 'long' })
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1)
  return `${day} de ${capitalized}`
}

// Prepara el valor para su uso.
function formatDiaSemana(date: Date): string {
  const raw = date.toLocaleDateString('es-AR', { weekday: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

// Obtiene los datos necesarios.
export function getDiasRestantesLabel(person: CelebracionPersona): string {
  if (isBirthdayToday(person)) return 'Hoy'
  const days = person.diasRestantes
  if (days === 1) return 'Falta 1 día'
  if (days != null && days > 1) return `Faltan ${days} días`
  return person.fecha || ''
}

// Construye el valor o recurso necesario.
export function buildUpcomingDisplay(person: CelebracionPersona): BirthdayUpcomingDisplay {
  const today = isBirthdayToday(person)
  const date = resolveBirthdayDate(person)

  return {
    person,
    fechaLabel: today ? 'Hoy' : date ? formatFechaLabel(date) : person.fecha,
    diaSemana: date && !today ? formatDiaSemana(date) : null,
    diasLabel: getDiasRestantesLabel(person),
    isToday: today,
  }
}

// Gestiona la operacion prepareMonthlyUpcomingBirthdays.
export function prepareMonthlyUpcomingBirthdays(
  persons: CelebracionPersona[],
): BirthdayUpcomingDisplay[] {
  return sortByUpcomingDate(filterMonthlyUpcoming(persons)).map(buildUpcomingDisplay)
}

// Construye el valor o recurso necesario.
export function buildUpcomingOnlyPersons(persons: CelebracionPersona[]): CelebracionPersona[] {
  return sortByUpcomingDate(filterMonthlyUpcoming(persons))
}

// Comprueba los datos o la condicion indicada.
export function isBirthdayUpcomingSoon(person: CelebracionPersona): boolean {
  return !isBirthdayToday(person) && (person.diasRestantes ?? 99) < 7
}

export type SelfBirthdayProfile = {
  id?: string | number
  fechaNac?: string | null
  nombreCompleto: string
  firstName: string
  sector: string
  sucursal: string
  foto?: string | null
}

// Comprueba los datos o la condicion indicada.
function isProfileBirthdayToday(fechaNac?: string | null): boolean {
  if (!fechaNac) return false
  const bday = new Date(fechaNac)
  if (Number.isNaN(bday.getTime())) return false
  const today = new Date()
  return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth()
}

/** Devuelve solo los cumpleaños de hoy para el carrusel o la tarjeta destacada del inicio. */
export function buildFeaturedDashboardBirthdays(
  celebraciones: CelebracionesDTO | null,
  self?: SelfBirthdayProfile | null,
): CelebracionPersona[] {
  let list = [...(celebraciones?.cumpleanosHoy ?? [])]

  if (self && isProfileBirthdayToday(self.fechaNac)) {
    const alreadyListed = list.some(
      (p) => p.nombreCompleto.toLowerCase() === self.nombreCompleto.toLowerCase(),
    )
    if (!alreadyListed) {
      list = [
        {
          id: self.id ?? 'self',
          nombre: self.firstName,
          apellido: '',
          nombreCompleto: self.nombreCompleto,
          area: self.sector,
          sucursal: self.sucursal,
          foto: self.foto ?? null,
          fecha: new Date().toISOString(),
          esHoy: true,
          diasRestantes: 0,
        },
        ...list,
      ]
    }
  }

  return list
}

/** Combina los cumpleaños de hoy con los próximos y elimina duplicados por identificador. */
export function mergeCelebracionLists(
  today: CelebracionPersona[],
  upcoming: CelebracionPersona[],
): CelebracionPersona[] {
  const seen = new Set<string>()
  const result: CelebracionPersona[] = []
  // Recorre los elementos de la coleccion.
  for (const p of [...today, ...upcoming]) {
    const key = String(p.id)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(p)
  }
  return result
}
