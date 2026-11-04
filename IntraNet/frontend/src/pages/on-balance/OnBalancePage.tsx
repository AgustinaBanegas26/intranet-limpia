import { ExternalLink, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

const ON_BALANCE_URL = 'https://onbalance.thomsonreuters.com.ar'

// Gestiona la accion correspondiente.
export function OnBalancePage() {
  return (
    <motion.div
      className="page-root"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero */}
      <div className="page-hero">
        <p className="page-kicker">Liquidaciones</p>
        <h1 className="page-hero-title">ON Balance</h1>
        <p className="page-hero-desc">Recibos y liquidaciones de sueldo vía Thomson Reuters.</p>
      </div>

      {/* Card */}
      <div className="card card-lg" style={{ display: 'grid', gap: 20 }}>
        {/* Info row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px',
            borderRadius: 16,
            background: 'var(--muted)',
          }}
        >
          <div className="icon-tile icon-tile-lg">
            <FileText size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem' }}>Thomson Reuters ON Balance</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
              Accedé a tus recibos de sueldo, histórico de liquidaciones y comprobantes.
            </p>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.65 }}>
          Al hacer clic serás redirigido al portal externo de ON Balance de Thomson Reuters,
          donde podés consultar y descargar tus recibos de sueldo de forma segura.
        </p>

        <a
          href={ON_BALANCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-lg btn-primary-fill btn-full"
        >
          <ExternalLink size={18} />
          Ir a ON Balance
        </a>
      </div>
    </motion.div>
  )
}
