// Obtiene los datos necesarios.
export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Buenos dias'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Obtiene los datos necesarios.
export function getFirstName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Usuario'
  return trimmed.split(/\s+/)[0] || trimmed
}
