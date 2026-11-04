import { Download, Share, Smartphone, X } from 'lucide-react'
import { usePwaInstall } from '../../context/PwaInstallContext'

// Gestiona la operacion platformLabel.
function platformLabel(isAndroid: boolean, isChrome: boolean, isEdge: boolean) {
  if (isAndroid && (isChrome || isEdge)) {
    return isEdge ? 'Microsoft Edge' : 'Google Chrome'
  }
  if (isEdge) return 'Microsoft Edge'
  if (isChrome) return 'Google Chrome'
  if (isAndroid) return 'Android'
  return 'tu navegador'
}

// Gestiona la operacion PwaInstallBanner.
export function PwaInstallBanner() {
  const {
    showInstallBanner,
    showIosHint,
    isIos,
    isAndroid,
    isChrome,
    isEdge,
    install,
    dismissLater,
    dismissIosHint,
  } = usePwaInstall()

  if (!showInstallBanner && !(showIosHint && isIos)) {
    return null
  }

  return (
    <>
      {showInstallBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-md"
          role="dialog"
          aria-modal="true"
          aria-label="Instalar aplicación"
        >
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-foreground">Instalá esta aplicación</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accedé más rápido desde tu dispositivo y disfrutá una experiencia similar a una
                  aplicación nativa.
                </p>
                {!isIos && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Disponible en {platformLabel(isAndroid, isChrome, isEdge)}.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={dismissLater}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Cerrar banner de instalación"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Instalar aplicación
              </button>
              <button
                type="button"
                onClick={dismissLater}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Más tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {showIosHint && isIos && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Instrucciones para instalar en iPhone o iPad"
          onClick={dismissIosHint}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Safari en iPhone / iPad</p>
                <h2 className="text-xl font-bold text-foreground">Para instalar:</h2>
              </div>
              <button
                type="button"
                onClick={dismissIosHint}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Cerrar instrucciones"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  1
                </span>
                <span>
                  Presioná <strong>Compartir</strong>
                  <Share className="ml-1 inline h-4 w-4 align-text-bottom" />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  2
                </span>
                <span>
                  Seleccioná <strong>Agregar a pantalla de inicio</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  3
                </span>
                <span>Confirmá la instalación.</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={dismissIosHint}
              className="mt-5 w-full rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
