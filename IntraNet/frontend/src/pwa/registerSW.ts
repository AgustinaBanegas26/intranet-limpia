// Soporte PWA: integra capacidades de aplicación web progresiva, como el service worker. Tema específico: registerSW.
import { registerSW } from 'virtual:pwa-register'

// Gestiona la operacion registerServiceWorker.
export function registerServiceWorker() {
  const updateSW = registerSW({
    immediate: true,
    // Gestiona la accion correspondiente.
    onRegistered(registration) {
      if (registration) {
        console.info('[PWA] Service worker registrado:', registration.scope)
      }
    },
    // Gestiona la accion correspondiente.
    onRegisterError(error) {
      console.error('[PWA] Error al registrar service worker:', error)
    },
    // Gestiona la accion correspondiente.
    onNeedRefresh() {
      console.info('[PWA] Hay una nueva versión disponible.')
      window.dispatchEvent(
        new CustomEvent('pwa:need-refresh', {
          detail: { updateSW },
        }),
      )
    },
    // Gestiona la accion correspondiente.
    onOfflineReady() {
      console.info('[PWA] La aplicación está lista para usarse sin conexión.')
      window.dispatchEvent(new CustomEvent('pwa:offline-ready'))
    },
  })

  return updateSW
}
