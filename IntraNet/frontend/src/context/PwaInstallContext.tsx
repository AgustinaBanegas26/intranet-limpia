import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const DISMISS_STORAGE_KEY = 'intranet:pwa-install-dismissed-at'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000
const AUTO_SHOW_DELAY_MS = 1500

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export type PwaPlatform = 'ios' | 'android' | 'chrome' | 'edge' | 'firefox' | 'other'

export type PwaInstallContextValue = {
  canInstall: boolean
  isInstalled: boolean
  platform: PwaPlatform
  isIos: boolean
  isAndroid: boolean
  isChrome: boolean
  isEdge: boolean
  showIosHint: boolean
  showInstallBanner: boolean
  install: () => Promise<boolean>
  dismissLater: () => void
  dismissIosHint: () => void
  openIosInstructions: () => void
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null)

function isStandaloneMode() {
  if (typeof window === 'undefined') return false

  const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches
  const mediaMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true

  return mediaStandalone || mediaMinimalUi || iosStandalone
}

function detectPlatform(): PwaPlatform {
  if (typeof window === 'undefined') return 'other'

  const ua = window.navigator.userAgent

  if (/iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) {
    return 'ios'
  }
  if (/Edg\//.test(ua)) return 'edge'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome'
  if (/Android/.test(ua)) return 'android'
  if (/Firefox\//.test(ua)) return 'firefox'
  return 'other'
}

function readDismissedRecently() {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY)
    if (!raw) return false

    const dismissedAt = Number(raw)
    if (!Number.isFinite(dismissedAt)) return false

    return Date.now() - dismissedAt < DISMISS_DURATION_MS
  } catch {
    return false
  }
}

function persistDismissLater() {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()))
  } catch {
    // ignore storage failures
  }
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode())
  const [platform, setPlatform] = useState<PwaPlatform>(() => detectPlatform())
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissedRecently, setDismissedRecently] = useState(() => readDismissedRecently())
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  const isIos = platform === 'ios'
  const isAndroid = platform === 'android'
  const isChrome = platform === 'chrome'
  const isEdge = platform === 'edge'

  const canInstall = !isInstalled && !dismissedRecently && (Boolean(deferredPrompt) || isIos)

  useEffect(() => {
    setIsInstalled(isStandaloneMode())
    setPlatform(detectPlatform())

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      console.info('[PWA] beforeinstallprompt capturado')
    }

    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
      setShowIosHint(false)
      setShowInstallBanner(false)
      console.info('[PWA] appinstalled')
    }

    const standaloneQuery = window.matchMedia('(display-mode: standalone)')
    const minimalUiQuery = window.matchMedia('(display-mode: minimal-ui)')

    const onDisplayModeChange = () => {
      setIsInstalled(isStandaloneMode())
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    standaloneQuery.addEventListener('change', onDisplayModeChange)
    minimalUiQuery.addEventListener('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      standaloneQuery.removeEventListener('change', onDisplayModeChange)
      minimalUiQuery.removeEventListener('change', onDisplayModeChange)
    }
  }, [])

  useEffect(() => {
    if (!canInstall) {
      setShowInstallBanner(false)
      return
    }

    const timer = window.setTimeout(() => {
      setShowInstallBanner(true)
    }, AUTO_SHOW_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [canInstall])

  const install = useCallback(async () => {
    if (isInstalled) return false

    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)

      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        setShowInstallBanner(false)
        console.info('[PWA] Instalación aceptada')
        return true
      }

      console.info('[PWA] Instalación rechazada')
      return false
    }

    if (isIos) {
      setShowIosHint(true)
      return false
    }

    return false
  }, [deferredPrompt, isInstalled, isIos])

  const dismissLater = useCallback(() => {
    persistDismissLater()
    setDismissedRecently(true)
    setShowInstallBanner(false)
    setShowIosHint(false)
  }, [])

  const dismissIosHint = useCallback(() => {
    setShowIosHint(false)
  }, [])

  const openIosInstructions = useCallback(() => {
    if (isIos && !isInstalled) {
      setShowIosHint(true)
    }
  }, [isInstalled, isIos])

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstall,
      isInstalled,
      platform,
      isIos,
      isAndroid,
      isChrome,
      isEdge,
      showIosHint,
      showInstallBanner,
      install,
      dismissLater,
      dismissIosHint,
      openIosInstructions,
    }),
    [
      canInstall,
      dismissIosHint,
      dismissLater,
      install,
      isAndroid,
      isChrome,
      isEdge,
      isInstalled,
      isIos,
      openIosInstructions,
      platform,
      showInstallBanner,
      showIosHint,
    ],
  )

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext)
  if (!context) {
    throw new Error('usePwaInstall debe usarse dentro de PwaInstallProvider')
  }
  return context
}
