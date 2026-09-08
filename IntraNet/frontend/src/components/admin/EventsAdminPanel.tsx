import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { PremiumCard } from '../ui/ProductUI'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { eventsService, type EventoDTO } from '../../services/events'

function fmtDate(dateStr: string) {
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function EventsAdminPanel() {
  const [items, setItems] = useState<EventoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await eventsService.getAll()
      setItems(res.data || [])
    } catch {
      setItems([])
      setError('No se pudieron cargar los eventos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: number) => {
    setSubmitting(true)
    setError('')
    try {
      await eventsService.remove(id)
      setItems((prev) => prev.filter((e) => e.id !== id))
      setDeleteId(null)
    } catch {
      setError('No se pudo eliminar el evento de la base de datos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PremiumCard
      title="Eventos"
      eyebrow="Agenda corporativa"
      icon={CalendarDays}
      action={(
        <Link to="/eventos" className="card-inline-link">
          Gestionar →
        </Link>
      )}
    >
      <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'var(--muted-foreground)', lineHeight: 1.55 }}>
        Eventos programados visibles en la intranet. Podés eliminarlos definitivamente desde acá.
      </p>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', margin: '0 0 12px' }}>{error}</p>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {loading ? (
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>Cargando eventos…</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No hay eventos programados.</p>
        ) : (
          items.map((event) => (
            <div key={event.id} className="slider-admin-row">
              <div className="slider-admin-row__thumb slider-admin-row__thumb--placeholder">
                <CalendarDays size={18} />
              </div>
              <div className="slider-admin-row__body">
                <strong>{event.titulo}</strong>
                <span>{fmtDate(event.fecha_inicio)}{event.lugar ? ` · ${event.lugar}` : ''}</span>
                <em>{event.asistentes ?? 0} confirmados</em>
              </div>
              <div className="slider-admin-row__actions">
                <Link to="/eventos" className="btn btn-sm btn-ghost" aria-label={`Editar evento ${event.titulo}`}>
                  <Pencil size={14} />
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setDeleteId(event.id)}
                  disabled={submitting}
                  aria-label={`Eliminar evento ${event.titulo}`}
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar evento?"
        description="Se borrará permanentemente de la base de datos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={submitting}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) await handleDelete(deleteId) }}
      />
    </PremiumCard>
  )
}
