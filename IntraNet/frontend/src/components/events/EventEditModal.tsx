import { useEffect, useState } from 'react'
import { FileText, ImagePlus, Loader2, X } from 'lucide-react'
import { SUCURSALES } from '../../data/profileData'
import { eventsService, type EventoDTO } from '../../services/events'
import { ModalBackdrop } from '../ui/ModalBackdrop'
import { readPdfAsDataUrl, resizeImageForSlider } from '../../utils/fileUpload'

type FormState = {
  titulo: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  lugar: string
  imagen_url: string
  pdf_url: string
  sedeMdp: boolean
  sedeCaba: boolean
  activo: boolean
}

// Gestiona la operacion toDatetimeLocal.
function toDatetimeLocal(value?: string | null) {
  if (!value) return ''
  const d = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  // Gestiona la operacion pad.
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Gestiona la operacion emptyForm.
function emptyForm(): FormState {
  return {
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    lugar: '',
    imagen_url: '',
    pdf_url: '',
    sedeMdp: true,
    sedeCaba: true,
    activo: true,
  }
}

// Gestiona la operacion formFromEvent.
function formFromEvent(event: EventoDTO): FormState {
  const destinos = event.sucursalesDestino || []
  return {
    titulo: event.titulo,
    descripcion: event.descripcion || '',
    fecha_inicio: toDatetimeLocal(event.fecha_inicio),
    fecha_fin: toDatetimeLocal(event.fecha_fin),
    lugar: event.lugar || '',
    imagen_url: event.imagen_url || '',
    pdf_url: event.pdf_url || '',
    sedeMdp: destinos.length === 0 || destinos.includes(SUCURSALES[1]),
    sedeCaba: destinos.length === 0 || destinos.includes(SUCURSALES[0]),
    activo: event.activo !== false,
  }
}

type Props = {
  event: EventoDTO | null
  onClose: () => void
  onSaved: (event: EventoDTO) => void
}

// Gestiona la operacion EventEditModal.
export function EventEditModal({ event, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!event) return
    setForm(formFromEvent(event))
    setError('')
  }, [event])

  useEffect(() => {
    if (!event) return
    // Gestiona la accion correspondiente.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [event, onClose])

  if (!event) return null

  // Gestiona la accion correspondiente.
  const handleImageUpload = async (file: File | null) => {
    if (!file) return
    setUploadingImage(true)
    setError('')
    try {
      const dataUrl = await resizeImageForSlider(file)
      setForm((p) => ({ ...p, imagen_url: dataUrl }))
    } catch {
      setError('No se pudo cargar la imagen.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Gestiona la accion correspondiente.
  const handlePdfUpload = async (file: File | null) => {
    if (!file) return
    setUploadingPdf(true)
    setError('')
    try {
      const dataUrl = await readPdfAsDataUrl(file)
      setForm((p) => ({ ...p, pdf_url: dataUrl }))
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setError(code === 'file_too_large' ? 'El PDF supera el tamaño máximo (8 MB).' : 'No se pudo cargar el PDF.')
    } finally {
      setUploadingPdf(false)
    }
  }

  // Gestiona la accion correspondiente.
  const handleSave = async () => {
    if (!form.titulo.trim() || !form.fecha_inicio) {
      setError('Título y fecha de inicio son obligatorios.')
      return
    }
    const sucursalesDestino: string[] = []
    if (form.sedeMdp) sucursalesDestino.push(SUCURSALES[1])
    if (form.sedeCaba) sucursalesDestino.push(SUCURSALES[0])
    if (sucursalesDestino.length === 0) {
      setError('Seleccioná al menos una sede destino.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await eventsService.update(event.id, {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || undefined,
        lugar: form.lugar.trim() || undefined,
        imagen_url: form.imagen_url || null,
        pdf_url: form.pdf_url || null,
        activo: form.activo,
        sucursales_destino: sucursalesDestino,
      })
      onSaved(res.data)
      onClose()
    } catch {
      setError('No se pudo guardar el evento.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBackdrop role="dialog" aria-modal="true" onClick={onClose}>
      <div className="profile-modal event-edit-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="page-kicker">Editar evento</p>
            <h3>{event.titulo}</h3>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div className="form-field">
            <label className="form-label">Título</label>
            <input className="form-input" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" rows={3} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div className="grid-2">
            <div className="form-field">
              <label className="form-label">Inicio</label>
              <input type="datetime-local" className="form-input" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Fin (opcional)</label>
              <input type="datetime-local" className="form-input" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Lugar</label>
            <input className="form-input" value={form.lugar} onChange={(e) => setForm((p) => ({ ...p, lugar: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Imagen</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <label className="btn btn-md btn-muted file-upload-btn">
                {uploadingImage ? <Loader2 size={15} className="spin" /> : <ImagePlus size={15} />}
                {uploadingImage ? 'Cargando…' : 'Subir imagen'}
                <input type="file" accept="image/*" hidden disabled={uploadingImage} onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)} />
              </label>
              {form.imagen_url && (
                <img src={form.imagen_url} alt="Vista previa" className="event-form-thumb" />
              )}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">PDF</label>
            <label className="btn btn-md btn-muted file-upload-btn">
              {uploadingPdf ? <Loader2 size={15} className="spin" /> : <FileText size={15} />}
              {uploadingPdf ? 'Cargando…' : form.pdf_url ? 'PDF cargado' : 'Adjuntar PDF'}
              <input type="file" accept="application/pdf,.pdf" hidden disabled={uploadingPdf} onChange={(e) => handlePdfUpload(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <label className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} style={{ accentColor: 'var(--primary)' }} />
            <span className="form-label" style={{ margin: 0 }}>Evento activo</span>
          </label>
          {error && <div className="auth-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-md btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting || uploadingImage || uploadingPdf} onClick={handleSave}>
              {submitting ? <Loader2 size={16} className="spin" /> : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  )
}
