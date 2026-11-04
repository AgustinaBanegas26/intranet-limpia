import { useCallback, useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const SCROLL_THRESHOLD = 320

// Gestiona la operacion ScrollToTopButton.
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Gestiona la accion correspondiente.
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className="scroll-to-top"
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.92 }}
          transition={{ duration: 0.2 }}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          <ArrowUp size={20} strokeWidth={2.25} aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
