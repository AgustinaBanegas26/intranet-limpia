// Datos de referencia del frontend: valores estáticos que la interfaz consume como contenido o configuración. Tema específico: beneficios para empleados.
export type BenefitCategory = {
  id: string
  label: string
  count: number
}

export type Benefit = {
  id: string
  title: string
  category: string
  description: string
  badge: string
  rating: number
  users: number
}

export const BENEFIT_CATEGORIES: BenefitCategory[] = [
  { id: 'salud', label: 'Salud', count: 8 },
  { id: 'gastronomia', label: 'Gastronomía', count: 15 },
  { id: 'educacion', label: 'Educación', count: 6 },
  { id: 'fitness', label: 'Fitness', count: 4 },
  { id: 'entretenimiento', label: 'Entretenimiento', count: 12 },
  { id: 'tecnologia', label: 'Tecnología', count: 5 },
]

export const FEATURED_BENEFITS: Benefit[] = [
  {
    id: 'b1',
    title: 'SmartFit',
    category: 'Fitness',
    description: 'Acceso a todas las sedes con descuento especial para empleados.',
    badge: '40% OFF',
    rating: 4.8,
    users: 24,
  },
  {
    id: 'b2',
    title: 'Udemy Business',
    category: 'Educación',
    description: 'Acceso ilimitado a cursos online de desarrollo profesional.',
    badge: 'Gratis',
    rating: 4.9,
    users: 38,
  },
  {
    id: 'b3',
    title: 'Pedidos Ya Pro',
    category: 'Gastronomía',
    description: 'Descuento en deliveries de restaurantes seleccionados.',
    badge: '30% OFF',
    rating: 4.6,
    users: 52,
  },
  {
    id: 'b4',
    title: 'OSDE',
    category: 'Salud',
    description: 'Cobertura médica integral con descuento corporativo.',
    badge: '50% OFF',
    rating: 4.7,
    users: 86,
  },
  {
    id: 'b5',
    title: 'Cinépolis',
    category: 'Entretenimiento',
    description: 'Dos entradas por el precio de una todos los martes.',
    badge: '2x1',
    rating: 4.5,
    users: 31,
  },
  {
    id: 'b6',
    title: 'Apple Store',
    category: 'Tecnología',
    description: 'Descuento en productos Apple para empleados.',
    badge: '15% OFF',
    rating: 4.9,
    users: 19,
  },
]

// Procesa los elementos de la coleccion.
export function filterBenefits(benefits: Benefit[], categoryId: string): Benefit[] {
  if (!categoryId || categoryId === 'all') return benefits
  const cat = BENEFIT_CATEGORIES.find((c) => c.id === categoryId)
  if (!cat) return benefits
  return benefits.filter((b) => b.category.toLowerCase() === cat.label.toLowerCase())
}
