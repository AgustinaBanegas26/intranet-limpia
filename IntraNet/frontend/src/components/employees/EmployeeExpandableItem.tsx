import { useCallback, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Eye } from 'lucide-react'
import { getInitials } from '../../context/AuthContext'

const PANEL_EASE = [0.22, 1, 0.36, 1] as const
const PANEL_DURATION = 0.28

export type EmployeeExpandableData = {
  id: string | number
  name: string
  foto?: string | null
  area?: string | null
  cargo?: string | null
  sucursal?: string | null
  email?: string | null
  telefono?: string | null
  activo?: boolean | null
  legajo?: string | number | null
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  const display = value != null && String(value).trim() !== '' ? String(value) : '—'
  return (
    <div className="employee-expandable__row">
      <span className="employee-expandable__row-label">{label}</span>
      <span className="employee-expandable__row-value">{display}</span>
    </div>
  )
}

function EmployeeAvatar({ name, foto }: { name: string; foto?: string | null }) {
  const initials = getInitials(name)
  return (
    <div className="avatar avatar-sm avatar-gradient employee-expandable__avatar">
      {foto ? (
        <img src={foto} alt="" className="employee-expandable__avatar-img" />
      ) : (
        initials
      )}
    </div>
  )
}

export function EmployeeExpandableItem({
  employee,
  showContact = false,
  showFoto = false,
  actions,
  headerActions,
  onEyeClick,
  defaultOpen = false,
}: {
  employee: EmployeeExpandableData
  showContact?: boolean
  showFoto?: boolean
  actions?: ReactNode
  headerActions?: ReactNode
  onEyeClick?: () => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = `employee-panel-${employee.id}`
  const triggerId = `employee-trigger-${employee.id}`
  const isActive = employee.activo !== false

  const toggle = useCallback(() => setOpen((v) => !v), [])

  return (
    <article className={`employee-expandable${open ? ' employee-expandable--open' : ''}`}>
      <div className="employee-expandable__header">
        <button
          type="button"
          id={triggerId}
          className="employee-expandable__trigger"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <EmployeeAvatar name={employee.name} foto={showFoto ? employee.foto : null} />
          <span className="employee-expandable__name">{employee.name}</span>
          <motion.span
            className="employee-expandable__chevron"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: PANEL_DURATION, ease: PANEL_EASE }}
            aria-hidden
          >
            <ChevronDown size={16} />
          </motion.span>
        </button>

        <div className="employee-expandable__header-actions">
          <button
            type="button"
            className="employee-expandable__eye"
            onClick={() => (onEyeClick ? onEyeClick() : toggle())}
            aria-expanded={onEyeClick ? undefined : open}
            aria-controls={onEyeClick ? undefined : panelId}
            aria-label={onEyeClick ? `Ver ficha de ${employee.name}` : open ? `Ocultar datos de ${employee.name}` : `Ver más sobre ${employee.name}`}
            title={onEyeClick ? 'Ver ficha completa' : open ? 'Ocultar' : 'Ver más'}
          >
            <Eye size={17} strokeWidth={2} aria-hidden />
          </button>
          {headerActions}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="employee-panel"
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: PANEL_DURATION, ease: PANEL_EASE }}
            className="employee-expandable__motion"
          >
            <div className="employee-expandable__panel">
              {employee.legajo != null && String(employee.legajo).trim() !== '' && (
                <DetailRow label="Legajo" value={employee.legajo} />
              )}
              <DetailRow label="Área" value={employee.area} />
              <DetailRow label="Cargo" value={employee.cargo} />
              <DetailRow label="Sucursal" value={employee.sucursal} />
              {showContact && (
                <>
                  <DetailRow label="Email" value={employee.email} />
                  <DetailRow label="Teléfono" value={employee.telefono} />
                </>
              )}
              <div className="employee-expandable__row">
                <span className="employee-expandable__row-label">Estado</span>
                <span className={`employee-expandable__status ${isActive ? 'status-success' : 'status-danger'}`}>
                  {isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {actions ? <div className="employee-expandable__actions">{actions}</div> : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

export function EmployeeExpandableList({ children }: { children: ReactNode }) {
  return <div className="employee-expandable-list">{children}</div>
}
