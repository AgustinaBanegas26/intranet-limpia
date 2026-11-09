// Pantalla del frontend: combina componentes React, estado y servicios para presentar este módulo al usuario. Tema específico: sugerencias de empleados.
import { useEffect, useState, useCallback } from 'react'
import { Lightbulb, Send, Loader2, Eye, X, Trash2 } from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ModalBackdrop } from '../../components/ui/ModalBackdrop'
import { useAuth } from '../../context/AuthContext'
import { suggestionsService, type SugerenciaDTO } from '../../services/suggestions'

const CATEGORIES = ['General', 'Espacio de trabajo', 'Beneficios', 'Bienestar', 'Horarios', 'Tecnologia', 'Cultura']

const STATUS_LABELS: Record<NonNullable<SugerenciaDTO['estado']>, string> = {
  review: 'En revisión',
  approved: 'Aprobada',
  implemented: 'Implementada',
  rejected: 'Rechazada',
}

const STATUS_COLORS: Record<NonNullable<SugerenciaDTO['estado']>, { color: string; bg: string }> = {
  review: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
  approved: { color: 'var(--success)', bg: 'var(--success-bg)' },
  implemented: { color: 'var(--primary)', bg: 'rgba(229,57,53,0.1)' },
  rejected: { color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

// Gestiona la operacion fmtDate.
function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Gestiona la operacion SuggestionsEmployeeView.
function SuggestionsEmployeeView() {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('General')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Gestiona la accion correspondiente.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setSubmitted(false)
    setError('')
    try {
      await suggestionsService.create({ descripcion: text.trim(), categoria: category })
      setText('')
      setCategory('General')
      setSubmitted(true)
    } catch {
      setError('No se pudo enviar la sugerencia. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-root suggestions-simple">
      <PageHero
        eyebrow="Comunidad"
        title="Sugerencias"
        description="Envianos una idea, mejora o comentario para que el equipo correspondiente pueda evaluarlo."
      />

      <PremiumCard title="Enviar sugerencia" eyebrow="Formulario simple" icon={Lightbulb}>
        {submitted && <div className="auth-success">Gracias. Tu sugerencia fue enviada.</div>}
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="suggestion-form">
          <label className="form-field">
            <span className="form-label">Categoria</span>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Sugerencia</span>
            <textarea
              className="form-input"
              rows={8}
              placeholder="Escribi tu idea con el contexto necesario para que pueda evaluarse correctamente."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </label>
          <div className="suggestion-actions">
            <button type="submit" disabled={submitting || !text.trim()} className="btn btn-md btn-primary-fill">
              <Send size={16} />
              {submitting ? 'Enviando...' : 'Enviar sugerencia'}
            </button>
          </div>
        </form>
      </PremiumCard>
    </div>
  )
}

// Gestiona la operacion SuggestionsAdminView.
function SuggestionsAdminView() {
  const [items, setItems] = useState<SugerenciaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | SugerenciaDTO['estado']>('todos')
  const [detail, setDetail] = useState<SugerenciaDTO | null>(null)
  const [updatingId, setUpdatingId] = useState<string | number | null>(null)
  const [deleteId, setDeleteId] = useState<string | number | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await suggestionsService.getAll()
      setItems(res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = filter === 'todos' ? items : items.filter((s) => s.estado === filter)

  // Gestiona la accion correspondiente.
  const handleStatusChange = async (id: string | number, estado: SugerenciaDTO['estado']) => {
    if (!estado) return
    setUpdatingId(id)
    try {
      await suggestionsService.updateStatus(id, estado)
      await load()
      setDetail((prev) => (prev?.id === id ? { ...prev, estado } : prev))
    } finally {
      setUpdatingId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: string | number) => {
    setDeleteBusy(true)
    setError('')
    try {
      await suggestionsService.remove(id)
      setDeleteId(null)
      setDetail(null)
      await load()
    } catch {
      setError('No se pudo eliminar la sugerencia.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Administración"
        title="Sugerencias recibidas"
        description="Revisá las ideas y comentarios enviados por los empleados."
      />

      <PremiumCard title="Bandeja de sugerencias" icon={Lightbulb}>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: 12 }}>{error}</p>}
        <div className="chip-row" style={{ marginBottom: 14 }}>
          <button type="button" className={`chip ${filter === 'todos' ? 'active' : ''}`} onClick={() => setFilter('todos')}>
            Todas ({items.length})
          </button>
          {(Object.keys(STATUS_LABELS) as NonNullable<SugerenciaDTO['estado']>[]).map((s) => (
            <button key={s} type="button" className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Cargando sugerencias…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>No hay sugerencias en este filtro.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empleado</th>
                  <th>Categoría</th>
                  <th>Contenido</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sug) => {
                  const estado = sug.estado || 'review'
                  const cfg = STATUS_COLORS[estado]
                  return (
                    <tr key={String(sug.id)}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>{fmtDate(sug.fecha)}</td>
                      <td style={{ fontWeight: 600 }}>{sug.autor || '—'}</td>
                      <td>{sug.categoria || 'General'}</td>
                      <td style={{ maxWidth: 240, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {sug.titulo || sug.descripcion?.slice(0, 80)}
                      </td>
                      <td>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          {STATUS_LABELS[estado]}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDetail(sug)}>
                          <Eye size={14} />
                          Revisar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PremiumCard>

      {detail && (
        <ModalBackdrop role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
          <div className="profile-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="page-kicker">Sugerencia</p>
                <h3>{detail.titulo || 'Sin título'}</h3>
              </div>
              <button type="button" className="btn btn-icon btn-ghost" onClick={() => setDetail(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="request-detail-grid" style={{ marginBottom: 16 }}>
              <div className="request-detail-item"><span>Fecha</span><strong>{fmtDate(detail.fecha)}</strong></div>
              <div className="request-detail-item"><span>Empleado</span><strong>{detail.autor || '—'}</strong></div>
              <div className="request-detail-item"><span>Categoría</span><strong>{detail.categoria || 'General'}</strong></div>
              <div className="request-detail-item"><span>Votos</span><strong>{detail.votos ?? 0}</strong></div>
            </div>

            <p className="request-detail-text" style={{ marginBottom: 20 }}>{detail.descripcion}</p>

            <div className="form-field">
              <label className="form-label">Cambiar estado</label>
              <select
                className="form-input"
                value={detail.estado || 'review'}
                disabled={updatingId === detail.id}
                onChange={(e) => handleStatusChange(detail.id!, e.target.value as SugerenciaDTO['estado'])}
              >
                {(Object.keys(STATUS_LABELS) as NonNullable<SugerenciaDTO['estado']>[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              {updatingId === detail.id && (
                <p style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} className="spin" /> Actualizando…
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-md btn-ghost"
                style={{ color: 'var(--danger)' }}
                onClick={() => setDeleteId(detail.id!)}
              >
                <Trash2 size={16} />
                Eliminar sugerencia
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar sugerencia?"
        description="Se eliminará permanentemente esta sugerencia y sus votos de la base de datos."
        confirmLabel="Eliminar"
        loading={deleteBusy}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) await handleDelete(deleteId) }}
      />
    </div>
  )
}

// Gestiona la operacion SuggestionsPage.
export function SuggestionsPage() {
  const { isAdmin } = useAuth()
  return isAdmin ? <SuggestionsAdminView /> : <SuggestionsEmployeeView />
}
