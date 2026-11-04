import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { AlertDialog, ConfirmDialog } from './ConfirmDialog'

type Props = {
  onConfirm: () => void | Promise<void>
  disabled?: boolean
  label?: string
}

// Elimina el elemento indicado.
function deleteErrorMessage(code: string) {
  if (code === 'forbidden') return 'No tenés permisos para eliminar este ítem.'
  if (code === 'not_found') return 'El ítem ya no existe o fue eliminado.'
  if (code === 'failed_to_delete_beneficio') return 'No se pudo eliminar el beneficio.'
  if (code === 'failed_to_delete_evento') return 'No se pudo eliminar el evento.'
  if (code === 'failed_to_delete_slide') return 'No se pudo eliminar el slide.'
  if (code === 'failed_to_delete_novedad') return 'No se pudo eliminar la novedad.'
  if (code === 'failed_to_delete_politica') return 'No se pudo eliminar la política.'
  if (code === 'failed_to_delete_manual') return 'No se pudo eliminar el manual.'
  return 'No se pudo completar la eliminación. Intentá de nuevo.'
}

// Gestiona la operacion AdminDeleteButton.
export function AdminDeleteButton({ onConfirm, disabled, label = 'Eliminar' }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gestiona la accion correspondiente.
  const handleConfirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      setOpen(false)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'request_failed'
      setError(deleteErrorMessage(code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-icon btn-ghost"
        title={label}
        disabled={disabled || busy}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        style={{ color: 'var(--danger)' }}
      >
        <Trash2 size={16} />
      </button>

      <ConfirmDialog
        open={open}
        title={`¿${label}?`}
        description="Esta acción no se puede deshacer."
        confirmLabel={label}
        loading={busy}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />

      <AlertDialog
        open={error != null}
        title="No se pudo eliminar"
        description={error ?? undefined}
        variant="danger"
        onClose={() => setError(null)}
      />
    </>
  )
}
