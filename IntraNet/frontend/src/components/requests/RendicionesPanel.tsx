// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: rendiciones de gastos.
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Clock, Eye, Loader2, Pencil, PlusCircle, Send, Trash2, X, XCircle } from 'lucide-react'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ModalBackdrop } from '../ui/ModalBackdrop'
import { PremiumCard } from '../ui/ProductUI'
import { rendicionesService, type RendicionDTO, type RendicionGastoDTO, type RendicionGastoPayload, type RendicionMedioPago } from '../../services/rendiciones'

type StatusFilter = 'todos' | 'pendiente' | 'enviada' | 'devuelta' | 'aprobada'

const statusLabels: Record<Exclude<StatusFilter, 'todos'>, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pendiente: { label: 'Pendiente', color: 'var(--warning)', bg: 'var(--warning-bg)', icon: Clock },
  enviada: { label: 'Enviada', color: 'var(--primary)', bg: 'var(--accent)', icon: Send },
  devuelta: { label: 'Devuelta', color: 'var(--danger)', bg: 'var(--danger-bg)', icon: XCircle },
  aprobada: { label: 'Aprobada', color: 'var(--success)', bg: 'var(--success-bg)', icon: CheckCircle },
}

const medioLabels: Record<RendicionMedioPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  comprobante: 'Comprobante',
}

const GASTO_ERROR_MESSAGES: Record<string, string> = {
  missing_fields: 'Completá fecha, concepto, medio de pago e importe válido.',
  invalid_gasto_fecha: 'La fecha del gasto está fuera del período del viático.',
  missing_comprobante: 'El comprobante es obligatorio para este medio de pago.',
}

// Gestiona la operacion fmtDate.
function fmtDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value.includes('T') ? value : `${value}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Gestiona la operacion fmtMoney.
function fmtMoney(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

// Prepara el valor para su uso.
function normalizeDateInput(value?: string | null) {
  if (!value) return ''
  return value.includes('T') ? value.slice(0, 10) : value
}

// Comprueba los datos o la condicion indicada.
function isEditable(rendicion?: RendicionDTO | null) {
  return rendicion?.estado === 'pendiente' || rendicion?.estado === 'devuelta'
}

// Gestiona la operacion emptyGasto.
function emptyGasto(): RendicionGastoPayload {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    observacion: '',
    medio_pago: 'efectivo',
    importe: 0,
    comprobante_url: '',
    comprobante_nombre: '',
  }
}

// Comprueba los datos o la condicion indicada.
function validateGasto(rendicion: RendicionDTO, form: RendicionGastoPayload): string | null {
  const fecha = normalizeDateInput(form.fecha)
  if (!fecha) return 'La fecha es obligatoria.'

  const parsed = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'La fecha ingresada no es válida.'

  const concepto = form.concepto.trim()
  if (!concepto) return 'El concepto es obligatorio.'

  const importe = Number(form.importe)
  if (!Number.isFinite(importe) || importe <= 0) return 'El importe debe ser mayor a 0.'

  const inicio = normalizeDateInput(rendicion.viatico?.fecha_inicio || rendicion.viatico?.fecha_necesaria)
  const fin = normalizeDateInput(rendicion.viatico?.fecha_finalizacion)
  if (inicio && fin && (fecha < inicio || fecha > fin)) {
    return `La fecha debe estar entre ${fmtDate(inicio)} y ${fmtDate(fin)} (período del viático).`
  }

  if (form.medio_pago === 'comprobante' && !form.comprobante_url?.trim()) {
    return 'El comprobante es obligatorio para este medio de pago.'
  }

  return null
}

// Gestiona la operacion gastoErrorMessage.
function gastoErrorMessage(err: unknown) {
  const code = err instanceof Error ? err.message : ''
  return GASTO_ERROR_MESSAGES[code] || 'No se pudo guardar el gasto.'
}

// Gestiona la operacion RendicionGastoRow.
function RendicionGastoRow({
  gasto,
  editable,
  onEdit,
  onDelete,
}: {
  gasto: RendicionGastoDTO
  editable: boolean
  onEdit: (gasto: RendicionGastoDTO) => void
  onDelete: (gasto: RendicionGastoDTO) => void
}) {
  return (
    <tr>
      <td data-label="Fecha">{fmtDate(gasto.fecha)}</td>
      <td data-label="Concepto">{gasto.concepto}</td>
      <td data-label="Observación">{gasto.observacion || '—'}</td>
      <td data-label="Medio de pago">{medioLabels[gasto.medio_pago]}</td>
      <td data-label="Importe" style={{ fontWeight: 700 }}>{fmtMoney(gasto.importe)}</td>
      <td data-label="Comprobante">{gasto.comprobante_url ? <a href={gasto.comprobante_url} target="_blank" rel="noreferrer">Ver</a> : '—'}</td>
      <td data-label="Acciones">
        {editable ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onEdit(gasto)}>
              <Pencil size={14} />
              Editar
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onDelete(gasto)}>
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}

// Gestiona la operacion RendicionSummaryCard.
function RendicionSummaryCard({
  item,
  onOpen,
}: {
  item: RendicionDTO
  onOpen: (id: number) => void
}) {
  const status = statusLabels[item.estado as Exclude<StatusFilter, 'todos'>]
  const StatusIcon = status.icon

  return (
    <article className="rendicion-summary-card">
      <div className="rendicion-summary-card__head">
        <strong>{item.viatico?.destino || 'Sin destino'}</strong>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: status.bg, color: status.color, padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
          <StatusIcon size={11} />
          {status.label}
        </span>
      </div>
      <div className="rendicion-summary-grid">
        <div><span>Fechas</span><strong>{fmtDate(item.viatico?.fecha_inicio)} → {fmtDate(item.viatico?.fecha_finalizacion)}</strong></div>
        <div><span>Monto aprobado</span><strong>{fmtMoney(item.monto_solicitado)}</strong></div>
        <div><span>Total rendido</span><strong>{fmtMoney(item.total_gastos)}</strong></div>
        <div><span>Diferencia</span><strong>{fmtMoney(item.diferencia)}</strong></div>
      </div>
      <button type="button" className="btn btn-sm btn-primary-fill" onClick={() => onOpen(item.id)}>
        {isEditable(item) ? <PlusCircle size={14} /> : <Eye size={14} />}
        {isEditable(item) ? 'Agregar detalles' : 'Ver detalle'}
      </button>
    </article>
  )
}

// Gestiona la operacion RendicionDetailModal.
function RendicionDetailModal({
  rendicion,
  onClose,
  onUpdated,
}: {
  rendicion: RendicionDTO
  onClose: () => void
  onUpdated: (item: RendicionDTO) => void
}) {
  const [busyId, setBusyId] = useState<number | string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<RendicionGastoDTO | null>(null)
  const [gastoIdEdit, setGastoIdEdit] = useState<number | null>(null)
  const [gastoForm, setGastoForm] = useState<RendicionGastoPayload>(emptyGasto())
  const [observaciones, setObservaciones] = useState(rendicion.observaciones || '')
  const [formError, setFormError] = useState('')
  const [error, setError] = useState('')

  const editable = isEditable(rendicion)
  const inicio = normalizeDateInput(rendicion.viatico?.fecha_inicio || rendicion.viatico?.fecha_necesaria)
  const fin = normalizeDateInput(rendicion.viatico?.fecha_finalizacion)

  useEffect(() => {
    // Gestiona la accion correspondiente.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    setObservaciones(rendicion.observaciones || '')
    setGastoForm(emptyGasto())
    setGastoIdEdit(null)
    setFormError('')
    setError('')
  }, [rendicion.id, rendicion.observaciones])

  // Gestiona la accion correspondiente.
  const handleSaveObservaciones = async () => {
    setBusyId(rendicion.id)
    setError('')
    try {
      const res = await rendicionesService.update(rendicion.id, { observaciones })
      onUpdated(res.data)
    } catch {
      setError('No se pudo guardar la rendición.')
    } finally {
      setBusyId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleSaveGasto = async () => {
    const validationError = validateGasto(rendicion, gastoForm)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setBusyId('gasto')
    setFormError('')
    setError('')
    try {
      const payload = {
        ...gastoForm,
        fecha: normalizeDateInput(gastoForm.fecha),
        concepto: gastoForm.concepto.trim(),
        importe: Number(gastoForm.importe),
      }
      const res = gastoIdEdit
        ? await rendicionesService.updateGasto(rendicion.id, gastoIdEdit, payload)
        : await rendicionesService.addGasto(rendicion.id, payload)
      onUpdated(res.data)
      setGastoForm(emptyGasto())
      setGastoIdEdit(null)
    } catch (err) {
      setFormError(gastoErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleEditGasto = (gasto: RendicionGastoDTO) => {
    setGastoIdEdit(gasto.id)
    setGastoForm({
      fecha: normalizeDateInput(gasto.fecha),
      concepto: gasto.concepto,
      observacion: gasto.observacion || '',
      medio_pago: gasto.medio_pago,
      importe: gasto.importe,
      comprobante_url: gasto.comprobante_url || '',
      comprobante_nombre: gasto.comprobante_nombre || '',
    })
    setFormError('')
  }

  // Gestiona la accion correspondiente.
  const handleDeleteGasto = async () => {
    if (!confirmDelete) return
    setBusyId(confirmDelete.id)
    setError('')
    try {
      const res = await rendicionesService.removeGasto(rendicion.id, confirmDelete.id)
      if (res.success) {
        const refreshed = await rendicionesService.getById(rendicion.id)
        onUpdated(refreshed.data)
      }
      setConfirmDelete(null)
    } catch {
      setError('No se pudo eliminar el gasto.')
    } finally {
      setBusyId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleSend = async () => {
    setBusyId('send')
    setError('')
    try {
      const res = await rendicionesService.send(rendicion.id, { observaciones })
      onUpdated(res.data)
    } catch {
      setError('No se pudo enviar la rendición.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <ModalBackdrop className="rendicion-detail-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
        <div className="profile-modal rendicion-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div>
              <p className="metric-label" style={{ margin: 0 }}>Rendición</p>
              <h3>{rendicion.viatico?.destino || 'Detalle de rendición'}</h3>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>

          <div className="rendicion-detail-modal__body">
          <div className="request-detail-grid" style={{ marginBottom: 14 }}>
            <div className="request-detail-item"><span>Destino</span><strong>{rendicion.viatico?.destino || '—'}</strong></div>
            <div className="request-detail-item"><span>Fechas del viático</span><strong>{fmtDate(rendicion.viatico?.fecha_inicio)} → {fmtDate(rendicion.viatico?.fecha_finalizacion)}</strong></div>
            <div className="request-detail-item"><span>Monto aprobado</span><strong>{fmtMoney(rendicion.monto_solicitado)}</strong></div>
            <div className="request-detail-item"><span>Total rendido</span><strong>{fmtMoney(rendicion.total_gastos)}</strong></div>
            <div className="request-detail-item"><span>Diferencia</span><strong>{fmtMoney(rendicion.diferencia)}</strong></div>
            <div className="request-detail-item"><span>Estado</span><strong>{statusLabels[rendicion.estado].label}</strong></div>
          </div>

          {rendicion.motivo_devolucion && (
            <div className="auth-error" style={{ marginBottom: 14 }}>
              <strong>Devolución:</strong> {rendicion.motivo_devolucion}
            </div>
          )}

          <div className="form-field" style={{ marginBottom: 14 }}>
            <label className="form-label">Observaciones generales</label>
            <textarea className="form-input" rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={!editable} />
          </div>

          {editable && (
            <>
              <p className="metric-label" style={{ marginBottom: 8 }}>Cargar gasto</p>
              {inicio && fin && (
                <p className="muted-copy" style={{ marginBottom: 10, fontSize: '0.82rem' }}>
                  Período permitido: {fmtDate(inicio)} a {fmtDate(fin)}.
                </p>
              )}
              <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                <div className="form-field">
                  <label className="form-label">Fecha</label>
                  <input className="form-input" type="date" min={inicio || undefined} max={fin || undefined} value={gastoForm.fecha} onChange={(e) => setGastoForm((current) => ({ ...current, fecha: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Concepto</label>
                  <input className="form-input" value={gastoForm.concepto} onChange={(e) => setGastoForm((current) => ({ ...current, concepto: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Observación</label>
                  <input className="form-input" value={gastoForm.observacion} onChange={(e) => setGastoForm((current) => ({ ...current, observacion: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Medio de pago</label>
                  <select className="form-input" value={gastoForm.medio_pago} onChange={(e) => setGastoForm((current) => ({ ...current, medio_pago: e.target.value as RendicionMedioPago }))}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="comprobante">Comprobante</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Importe</label>
                  <input className="form-input" type="number" min="0.01" step="0.01" value={String(gastoForm.importe ?? '')} onChange={(e) => setGastoForm((current) => ({ ...current, importe: Number(e.target.value) }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Comprobante URL</label>
                  <input className="form-input" value={gastoForm.comprobante_url} onChange={(e) => setGastoForm((current) => ({ ...current, comprobante_url: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              {formError && <p className="form-feedback" style={{ marginBottom: 10 }}>{formError}</p>}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-md btn-primary-fill" onClick={() => void handleSaveGasto()} disabled={busyId === 'gasto'}>
                  {busyId === 'gasto' ? <Loader2 size={16} className="spin" /> : <PlusCircle size={16} />}
                  {gastoIdEdit ? 'Actualizar gasto' : 'Agregar gasto'}
                </button>
                {gastoIdEdit && (
                  <button type="button" className="btn btn-md btn-ghost" onClick={() => { setGastoIdEdit(null); setGastoForm(emptyGasto()); setFormError('') }}>
                    Cancelar edición
                  </button>
                )}
              </div>
            </>
          )}

          <div className="table-wrap" style={{ marginBottom: 16 }}>
            <table className="data-table data-table--stack">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Observación</th>
                  <th>Medio de pago</th>
                  <th>Importe</th>
                  <th>Comprobante</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(rendicion.gastos || []).length === 0 ? (
                  <tr><td colSpan={7}>Sin gastos cargados.</td></tr>
                ) : (
                  (rendicion.gastos || []).map((gasto) => (
                    <RendicionGastoRow
                      key={gasto.id}
                      gasto={gasto}
                      editable={editable}
                      onEdit={handleEditGasto}
                      onDelete={setConfirmDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            <div className="request-detail-item"><span>Total efectivo</span><strong>{fmtMoney(rendicion.total_efectivo)}</strong></div>
            <div className="request-detail-item"><span>Total tarjeta</span><strong>{fmtMoney(rendicion.total_tarjeta)}</strong></div>
            <div className="request-detail-item"><span>Total comprobantes</span><strong>{fmtMoney(rendicion.total_comprobantes)}</strong></div>
          </div>

          {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
          </div>

          <div className="modal-actions rendicion-detail-modal__actions">
            <button type="button" className="btn btn-md btn-ghost" onClick={onClose}>Cerrar</button>
            {editable && (
              <>
                <button type="button" className="btn btn-md btn-ghost" onClick={() => void handleSaveObservaciones()} disabled={busyId === rendicion.id}>
                  {busyId === rendicion.id ? <Loader2 size={16} className="spin" /> : <Pencil size={16} />}
                  Guardar borrador
                </button>
                <button type="button" className="btn btn-md btn-primary-fill" onClick={() => void handleSend()} disabled={busyId === 'send'}>
                  {busyId === 'send' ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                  Enviar rendición
                </button>
              </>
            )}
          </div>
        </div>
      </ModalBackdrop>

      <ConfirmDialog
        open={confirmDelete != null}
        title="¿Eliminar gasto?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={busyId === confirmDelete?.id}
        onConfirm={() => void handleDeleteGasto()}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}

// Gestiona la operacion RendicionesPanel.
export function RendicionesPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<RendicionDTO[]>([])
  const [filter, setFilter] = useState<StatusFilter>('todos')
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)

  // Obtiene los datos necesarios.
  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await rendicionesService.getAll()
      setItems(res.data || [])
    } catch (err) {
      console.error(err)
      setItems([])
      setError('No se pudieron cargar las rendiciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const detail = useMemo(() => items.find((item) => item.id === detailId) || null, [items, detailId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter((item) => filter === 'todos' || item.estado === filter)
      .filter((item) => {
        if (!q) return true
        const values = [
          item.viatico?.nombre_completo,
          item.viatico?.solicitante?.nombre,
          item.viatico?.area,
          item.viatico?.destino,
          item.viatico?.motivo_viaje,
          item.observaciones,
          item.motivo_devolucion,
        ]
        return values.some((value) => String(value || '').toLowerCase().includes(q))
      })
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  }, [items, filter, search])

  const summary = {
    total: items.length,
    pendientes: items.filter((item) => item.estado === 'pendiente').length,
    enviadas: items.filter((item) => item.estado === 'enviada').length,
    devueltas: items.filter((item) => item.estado === 'devuelta').length,
    aprobadas: items.filter((item) => item.estado === 'aprobada').length,
  }

  // Gestiona la accion correspondiente.
  const handleUpdated = (updated: RendicionDTO) => {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  return (
    <div className="request-form-grid rendiciones-panel-grid">
      <PremiumCard title="Mis rendiciones" eyebrow="Viáticos" icon={Clock}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Buscar</label>
          <input className="form-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Destino, área, observaciones…" />
        </div>

        <div className="chip-row chip-row--scroll" style={{ marginBottom: 14 }}>
          {(['todos', 'pendiente', 'enviada', 'devuelta', 'aprobada'] as const).map((state) => (
            <button key={state} type="button" className={`chip ${filter === state ? 'active' : ''}`} onClick={() => setFilter(state)}>
              {state === 'todos' ? 'Todas' : statusLabels[state].label}
            </button>
          ))}
        </div>

        <div className="rendiciones-metrics" style={{ marginBottom: 14 }}>
          <div className="metric-card"><p className="metric-label">Total</p><p className="metric-value">{summary.total}</p></div>
          <div className="metric-card"><p className="metric-label">Pendientes</p><p className="metric-value" style={{ color: 'var(--warning)' }}>{summary.pendientes}</p></div>
          <div className="metric-card"><p className="metric-label">Enviadas</p><p className="metric-value" style={{ color: 'var(--primary)' }}>{summary.enviadas}</p></div>
          <div className="metric-card"><p className="metric-label">Devueltas</p><p className="metric-value" style={{ color: 'var(--danger)' }}>{summary.devueltas}</p></div>
          <div className="metric-card"><p className="metric-label">Aprobadas</p><p className="metric-value" style={{ color: 'var(--success)' }}>{summary.aprobadas}</p></div>
        </div>

        {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 24, color: 'var(--muted-foreground)' }}>
            <Loader2 size={18} className="spin" /> Cargando rendiciones…
          </div>
        ) : filtered.length === 0 ? (
          <p className="muted-copy">
            {items.length === 0
              ? 'Todavía no tenés rendiciones habilitadas. Aparecerán acá cuando un viático aprobado finalice según su fecha de finalización.'
              : 'No hay rendiciones que coincidan con el filtro seleccionado.'}
          </p>
        ) : (
          <>
            <div className="rendiciones-list rendiciones-mobile-list">
              {filtered.map((item) => (
                <RendicionSummaryCard key={item.id} item={item} onOpen={setDetailId} />
              ))}
            </div>

            <div className="table-wrap rendiciones-desktop-table">
              <table className="data-table data-table--stack">
                <thead>
                  <tr>
                    <th>Destino</th>
                    <th>Fechas</th>
                    <th>Monto aprobado</th>
                    <th>Total rendido</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const status = statusLabels[item.estado as Exclude<StatusFilter, 'todos'>]
                    const StatusIcon = status.icon
                    return (
                      <tr key={item.id}>
                        <td data-label="Destino">{item.viatico?.destino || '—'}</td>
                        <td data-label="Fechas" style={{ color: 'var(--muted-foreground)' }}>
                          {fmtDate(item.viatico?.fecha_inicio)} → {fmtDate(item.viatico?.fecha_finalizacion)}
                        </td>
                        <td data-label="Monto aprobado">{fmtMoney(item.monto_solicitado)}</td>
                        <td data-label="Total rendido">{fmtMoney(item.total_gastos)}</td>
                        <td data-label="Estado">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: status.bg, color: status.color, padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                            <StatusIcon size={11} />
                            {status.label}
                          </span>
                        </td>
                        <td data-label="Acción">
                          <button type="button" className="btn btn-sm btn-primary-fill" onClick={() => setDetailId(item.id)}>
                            {isEditable(item) ? 'Agregar detalles' : 'Ver detalle'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </PremiumCard>

      {detail && (
        <RendicionDetailModal
          rendicion={detail}
          onClose={() => setDetailId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
