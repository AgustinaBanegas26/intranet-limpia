import { RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type PwaNeedRefreshDetail = {
  updateSW: (reloadPage?: boolean) => Promise<void>
}

// Gestiona la operacion PwaUpdateToast.
export function PwaUpdateToast() {
  const [visible, setVisible] = useState(false)
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    // Gestiona la accion correspondiente.
    const onNeedRefresh = (event: Event) => {
      const detail = (event as CustomEvent<PwaNeedRefreshDetail>).detail
      if (!detail?.updateSW) return

      setUpdateSW(() => detail.updateSW)
      setVisible(true)
    }

    window.addEventListener('pwa:need-refresh', onNeedRefresh as EventListener)
    return () => window.removeEventListener('pwa:need-refresh', onNeedRefresh as EventListener)
  }, [])

  if (!visible || !updateSW) {
    return null
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[95] p-4 sm:inset-x-auto sm:left-1/2 sm:top-4 sm:w-full sm:max-w-lg sm:-translate-x-1/2">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <RefreshCw className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Nueva versión disponible</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Hay una actualización de la aplicación lista para instalarse.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void updateSW(true)}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Actualizar ahora
            </button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Después
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cerrar aviso de actualización"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
