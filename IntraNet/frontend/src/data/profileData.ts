// Datos de referencia del frontend: valores estáticos que la interfaz consume como contenido o configuración. Tema específico: perfil del empleado.
export const ESTADOS_CIVILES = [
  'Soltero/a',
  'Casado/a',
  'Divorciado/a',
  'Viudo/a',
  'Unión convivencial',
]

export const AREAS = [
  'Administración',
  'Administrativo',
  'Auditoría y Stock',
  'Caja',
  'Compras',
  'Compras FOB',
  'Corporativo',
  'Créditos y Cobranzas',
  'Gerencia',
  'Logística',
  'Logística (Referente)',
  'Maestranza',
  'Marketplace',
  'PM',
  'Producción',
  'RMA',
  'RR. HH.',
  'Seguridad',
  'Ventas',
  'Ventas (Referente)',
  'Ventas Canal',
  'Ventas Retail',
]

/** @deprecated Usar AREAS o cargar desde /sectores */
export const SECTORES = AREAS

export const SUCURSALES = ['Buenos Aires', 'Mar del Plata']

export const CANTIDAD_PERSONAS = ['1', '2', '3', '4', '5', '6+']

// Prepara el valor para su uso.
export function parseSucursalesStored(value?: string | null): string[] {
  if (!value) return []
  return String(value)
    .split(/[·,|/]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// Prepara el valor para su uso.
export function formatSucursalesStored(values: string[]): string {
  return values.filter(Boolean).slice(0, 2).join(' · ')
}
