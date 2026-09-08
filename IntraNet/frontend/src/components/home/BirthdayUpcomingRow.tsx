import type { BirthdayUpcomingDisplay } from '../../utils/birthdayUpcoming'
import { BirthdayAvatar } from './BirthdayAvatar'

interface BirthdayUpcomingRowProps {
  item: BirthdayUpcomingDisplay
}

export function BirthdayUpcomingRow({ item }: BirthdayUpcomingRowProps) {
  const { person, fechaLabel, diaSemana, diasLabel } = item
  const location = [person.area, person.sucursal].filter(Boolean).join(' · ')
  const dateText = [fechaLabel, diaSemana, diasLabel].filter(Boolean).join(' · ')

  return (
    <div className="bc-upcoming-row bc-upcoming-row--compact">
      <BirthdayAvatar
        foto={person.foto}
        nombreCompleto={person.nombreCompleto}
        size="xs"
        compact
      />
      <div className="bc-upcoming-row__main">
        <span className="bc-upcoming-row__name">{person.nombreCompleto}</span>
        {location ? (
          <>
            <span className="bc-upcoming-row__sep" aria-hidden="true">·</span>
            <span className="bc-upcoming-row__meta">{location}</span>
          </>
        ) : null}
      </div>
      <span className="bc-upcoming-row__date">{dateText}</span>
    </div>
  )
}
