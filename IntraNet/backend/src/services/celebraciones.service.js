const supabase = require('../config/supabase')

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDateOnly(value) {
  if (!value) return null
  const raw = String(value).slice(0, 10)
  const [year, month, day] = raw.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

function nextAnnualOccurrence(month, day, fromDate = new Date()) {
  const base = startOfDay(fromDate)
  let candidate = new Date(base.getFullYear(), month - 1, day)
  if (candidate < base) {
    candidate = new Date(base.getFullYear() + 1, month - 1, day)
  }
  return candidate
}

function daysUntil(fromDate, targetDate) {
  const ms = startOfDay(targetDate).getTime() - startOfDay(fromDate).getTime()
  return Math.round(ms / 86_400_000)
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(date)
}

function mapPerson(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    nombreCompleto: `${row.nombre || ''} ${row.apellido || ''}`.trim(),
    area: row.area || null,
    sucursal: row.sucursal || null,
    foto: row.foto_url || null,
  }
}

async function getCelebraciones({ upcomingDays = 14 } = {}) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const { data: empleados, error } = await supabase
    .from('empleados')
    .select('id, nombre, apellido, area, sucursal, foto_url, fecha_nacimiento, fecha_ingreso, activo')
    .eq('activo', true)

  if (error) {
    console.error('[celebraciones.service] SUPABASE ERROR:', error)
    throw error
  }

  const today = startOfDay(new Date())
  const currentMonth = today.getMonth() + 1

  const cumpleanosHoy = []
  const proximosCumpleanos = []
  const aniversariosMes = []
  const aniversariosHoy = []
  const currentDay = today.getDate()

  for (const row of empleados || []) {
    const person = mapPerson(row)
    const birth = parseDateOnly(row.fecha_nacimiento)

    if (birth) {
      const nextBirthday = nextAnnualOccurrence(birth.month, birth.day, today)
      const diff = daysUntil(today, nextBirthday)

      if (diff === 0) {
        cumpleanosHoy.push({
          ...person,
          fecha: 'Hoy',
          esHoy: true,
        })
      } else if (diff > 0 && diff <= upcomingDays) {
        proximosCumpleanos.push({
          ...person,
          fecha: formatShortDate(nextBirthday),
          esHoy: false,
          diasRestantes: diff,
        })
      }
    }

    const hire = parseDateOnly(row.fecha_ingreso)
    if (hire && hire.month === currentMonth) {
      const years = today.getFullYear() - hire.year
      if (years > 0) {
        const anniversaryDate = new Date(today.getFullYear(), hire.month - 1, hire.day)
        aniversariosMes.push({
          ...person,
          anios: years,
          fecha: formatShortDate(anniversaryDate),
        })
        if (hire.day === currentDay) {
          aniversariosHoy.push({
            ...person,
            anios: years,
            fecha: 'Hoy',
          })
        }
      }
    }
  }

  proximosCumpleanos.sort((a, b) => a.diasRestantes - b.diasRestantes)
  aniversariosMes.sort((a, b) => a.anios - b.anios)
  aniversariosHoy.sort((a, b) => a.anios - b.anios)

  return {
    cumpleanosHoy,
    proximosCumpleanos,
    aniversariosMes,
    aniversariosHoy,
  }
}

module.exports = {
  getCelebraciones,
}
