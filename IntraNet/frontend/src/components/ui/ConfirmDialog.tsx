import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

// Prepara el estado o comportamiento del componente.
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}

// Gestiona la operacion ConfirmDialog.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    // Gestiona la accion correspondiente.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, loading, onCancel])

  // Gestiona la accion correspondiente.
  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  const isLoading = loading || busy

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="confirm-dialog-backdrop"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby={description ? 'confirm-dialog-desc' : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => { if (!isLoading) onCancel() }}
        >
          <motion.div
            className={`confirm-dialog ${variant}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`confirm-dialog-icon ${variant}`}>
              <AlertTriangle size={22} />
            </div>
            <h3 id="confirm-dialog-title" className="confirm-dialog-title">{title}</h3>
            {description && (
              <p id="confirm-dialog-desc" className="confirm-dialog-desc">{description}</p>
            )}
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="btn btn-md btn-ghost"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`btn btn-md ${variant === 'danger' ? 'btn-danger-fill' : 'btn-primary-fill'}`}
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Procesando…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

type AlertDialogProps = {
  open: boolean
  title: string
  description?: string
  buttonLabel?: string
  variant?: 'danger' | 'info'
  onClose: () => void
}

// Gestiona la operacion AlertDialog.
export function AlertDialog({
  open,
  title,
  description,
  buttonLabel = 'Entendido',
  variant = 'info',
  onClose,
}: AlertDialogProps) {
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    // Gestiona la accion correspondiente.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="confirm-dialog-backdrop"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alert-dialog-title"
          aria-describedby={description ? 'alert-dialog-desc' : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className={`confirm-dialog ${variant}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`confirm-dialog-icon ${variant}`}>
              {variant === 'danger' ? <AlertTriangle size={22} /> : <Info size={22} />}
            </div>
            <h3 id="alert-dialog-title" className="confirm-dialog-title">{title}</h3>
            {description && (
              <p id="alert-dialog-desc" className="confirm-dialog-desc">{description}</p>
            )}
            <div className="confirm-dialog-actions confirm-dialog-actions--single">
              <button type="button" className="btn btn-md btn-primary-fill" onClick={onClose}>
                {buttonLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
