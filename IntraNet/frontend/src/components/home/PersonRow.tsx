import { getInitials } from '../../context/AuthContext'

type PersonRowProps = {
  nombreCompleto: string
  area?: string | null
  foto?: string | null
  meta: string
}

export function PersonRow({ nombreCompleto, area, foto, meta }: PersonRowProps) {
  const initials = getInitials(nombreCompleto)

  return (
    <div className="gn-person-row">
      <div className="gn-person-avatar" aria-hidden="true">
        {foto ? <img src={foto} alt="" /> : <span>{initials}</span>}
      </div>
      <div className="gn-person-copy">
        <p className="gn-person-name">{nombreCompleto}</p>
        <p className="gn-person-meta">
          {[area, meta].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  )
}
