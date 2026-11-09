// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: contenido desplegable reutilizable.
import { useMemo } from 'react'
import type { CelebracionPersona } from '../../services/celebraciones'
import { prepareMonthlyUpcomingBirthdays } from '../../utils/birthdayUpcoming'
import { Accordion } from '../ui/Accordion'
import { BirthdayUpcomingRow } from './BirthdayUpcomingRow'

interface BirthdayUpcomingAccordionProps {
  persons: CelebracionPersona[]
  embedded?: boolean
  alwaysShow?: boolean
}

// Gestiona la operacion BirthdayUpcomingAccordion.
export function BirthdayUpcomingAccordion({
  persons,
  embedded = false,
  alwaysShow = false,
}: BirthdayUpcomingAccordionProps) {
  const items = useMemo(() => prepareMonthlyUpcomingBirthdays(persons), [persons])

  if (!alwaysShow && items.length === 0) return null

  const inner = (
    <Accordion
      embedded={embedded}
      title="Próximos cumpleaños del mes"
      count={items.length > 0 ? items.length : undefined}
    >
      {items.length === 0 ? (
        <p className="bc-accordion__empty">No hay más cumpleaños este mes.</p>
      ) : (
        <div className="bc-accordion__list bc-accordion__list--compact">
          {items.map((item) => (
            <BirthdayUpcomingRow key={String(item.person.id)} item={item} />
          ))}
        </div>
      )}
    </Accordion>
  )

  if (embedded) return inner

  return <div className="bc-card bc-card--accordion-standalone">{inner}</div>
}
