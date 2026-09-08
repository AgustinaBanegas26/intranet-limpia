import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker() {
  const updateSW = registerSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        console.info('[PWA] Service worker registrado:', registration.scope)
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Error al registrar service worker:', error)
    },
    onNeedRefresh() {
      console.info('[PWA] Hay una nueva versión disponible.')
      window.dispatchEvent(
        new CustomEvent('pwa:need-refresh', {
          detail: { updateSW },
        }),
      )
    },
    onOfflineReady() {
      console.info('[PWA] La aplicación está lista para usarse sin conexión.')
      window.dispatchEvent(new CustomEvent('pwa:offline-ready'))
    },
  })

  return updateSW
}
