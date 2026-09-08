import { useId, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const ACCORDION_EASE = [0.22, 1, 0.36, 1] as const
const ACCORDION_DURATION = 0.3

export interface AccordionProps {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  count?: number
  embedded?: boolean
  id?: string
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
  className,
  count,
  embedded = false,
  id: externalId,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const autoId = useId()
  const panelId = externalId ?? `accordion-panel-${autoId}`
  const triggerId = `accordion-trigger-${autoId}`

  return (
    <div
      className={`bc-accordion${embedded ? ' bc-accordion--embedded' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        id={triggerId}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="bc-accordion__trigger"
      >
        <span className="bc-accordion__label">
          {title}
          {count != null && count > 0 && (
            <span className="bc-accordion__count" aria-hidden="true">
              {count}
            </span>
          )}
        </span>
        <motion.span
          className="bc-accordion__chevron"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: ACCORDION_DURATION, ease: ACCORDION_EASE }}
          aria-hidden="true"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="accordion-panel"
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -6 }}
            transition={{ duration: ACCORDION_DURATION, ease: ACCORDION_EASE }}
            className="bc-accordion__motion"
          >
            <div className="bc-accordion__content">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
