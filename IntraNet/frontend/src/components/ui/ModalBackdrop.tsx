// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: ventana modal reutilizable.
import { useEffect, type HTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ModalBackdropProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  lockScroll?: boolean
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

/**
 * Contenedor visual de modales: portal a body, backdrop unificado y scroll lock.
 * No modifica el contenido interno del modal.
 */
export function ModalBackdrop({
  children,
  lockScroll = true,
  className,
  ...props
}: ModalBackdropProps) {
  useBodyScrollLock(lockScroll)

  const classes = ['modal-backdrop', className].filter(Boolean).join(' ')

  return createPortal(
    <div className={classes} {...props}>
      {children}
    </div>,
    document.body,
  )
}
