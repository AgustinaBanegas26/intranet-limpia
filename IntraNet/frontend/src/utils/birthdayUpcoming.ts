import type { CelebracionPersona, CelebracionesDTO } from '../services/celebraciones'

export type BirthdayUpcomingDisplay = {
  person: CelebracionPersona
  fechaLabel: string
  diaSemana: string | null
  diasLabel: string
  isToday: boolean
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function daysUntilEndOfMonth(from = new Date()): number {
  const today = startOfDay(from)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return Math.round((end.getTime() - today.getTime()) / 86_400_000)
}

export function isBirthdayToday(person: CelebracionPersona): boolean {
  return person.esHoy === true || person.diasRestantes === 0
}

export function isBirthdayPast(person: CelebracionPersona): boolean {
  const days = person.diasRestantes
  return days != null && days < 0
}

/** Remaining birthdays in the current calendar month (excludes today and past). */
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

export function sortByUpcomingDate(persons: CelebracionPersona[]): CelebracionPersona[] {
  return [...persons].sort((a, b) => {
    const da = a.diasRestantes ?? Number.MAX_SAFE_INTEGER
    const db = b.diasRestantes ?? Number.MAX_SAFE_INTEGER
    return da - db
  })
}

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

function formatFechaLabel(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleDateString('es-AR', { month: 'long' })
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1)
  return `${day} de ${capitalized}`
}

function formatDiaSemana(date: Date): string {
  const raw = date.toLocaleDateString('es-AR', { weekday: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function getDiasRestantesLabel(person: CelebracionPersona): string {
  if (isBirthdayToday(person)) return 'Hoy'
  const days = person.diasRestantes
  if (days === 1) return 'Falta 1 día'
  if (days != null && days > 1) return `Faltan ${days} días`
  return person.fecha || ''
}

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

export function prepareMonthlyUpcomingBirthdays(
  persons: CelebracionPersona[],
): BirthdayUpcomingDisplay[] {
  return sortByUpcomingDate(filterMonthlyUpcoming(persons)).map(buildUpcomingDisplay)
}

export function buildUpcomingOnlyPersons(persons: CelebracionPersona[]): CelebracionPersona[] {
  return sortByUpcomingDate(filterMonthlyUpcoming(persons))
}

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

function isProfileBirthdayToday(fechaNac?: string | null): boolean {
  if (!fechaNac) return false
  const bday = new Date(fechaNac)
  if (Number.isNaN(bday.getTime())) return false
  const today = new Date()
  return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth()
}

/** Today's birthdays only — for dashboard slider / hero card. */
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

/** Merge today + upcoming lists and dedupe by id. */
export function mergeCelebracionLists(
  today: CelebracionPersona[],
  upcoming: CelebracionPersona[],
): CelebracionPersona[] {
  const seen = new Set<string>()
  const result: CelebracionPersona[] = []
  for (const p of [...today, ...upcoming]) {
    const key = String(p.id)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(p)
  }
  return result
}
