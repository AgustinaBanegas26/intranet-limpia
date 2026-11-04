import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  FileUp,
  ImagePlus,
  Megaphone,
  Paperclip,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { SUCURSALES } from '../../data/profileData'
import { newsService, type CreateNovedadPayload } from '../../services/news'
import { authErrorMessage } from '../../utils/sessionToken'
import { PremiumCard } from '../ui/ProductUI'

const MAX_IMAGE_MB = 4
const MAX_FILE_MB = 6
const DESTACADO_DIAS = 7

type NewsComposerProps = {
  token: string | null
  onPublished?: () => void
}

// Obtiene los datos necesarios.
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    // Gestiona la accion correspondiente.
    reader.onload = () => resolve(String(reader.result))
    // Gestiona la accion correspondiente.
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(file)
  })
}

// Gestiona la operacion NewsComposer.
export function NewsComposer({ token, onPublished }: NewsComposerProps) {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [importante, setImportante] = useState(false)
  const [sedeMdp, setSedeMdp] = useState(true)
  const [sedeCaba, setSedeCaba] = useState(true)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [imagenData, setImagenData] = useState<string | null>(null)
  const [archivo, setArchivo] = useState<{ url: string; nombre: string; tipo: string } | null>(null)
  const [conEncuesta, setConEncuesta] = useState(false)
  const [preguntaEncuesta, setPreguntaEncuesta] = useState('')
  const [opcionesEncuesta, setOpcionesEncuesta] = useState(['', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = useCallback(() => {
    setTitulo('')
    setContenido('')
    setImportante(false)
    setSedeMdp(true)
    setSedeCaba(true)
    setImagenPreview(null)
    setImagenData(null)
    setArchivo(null)
    setConEncuesta(false)
    setPreguntaEncuesta('')
    setOpcionesEncuesta(['', ''])
    setError(null)
  }, [])

  // Gestiona la accion correspondiente.
  const handleImage = async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('La imagen debe ser JPG, PNG o WebP.')
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`La imagen no puede superar ${MAX_IMAGE_MB} MB.`)
      return
    }
    const data = await readFileAsDataUrl(file)
    setImagenData(data)
    setImagenPreview(data)
    setError(null)
  }

  // Gestiona la accion correspondiente.
  const handleArchivo = async (file: File | null) => {
    if (!file) return
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`El archivo no puede superar ${MAX_FILE_MB} MB.`)
      return
    }
    const data = await readFileAsDataUrl(file)
    setArchivo({ url: data, nombre: file.name, tipo: file.type || 'application/octet-stream' })
    setError(null)
  }

  // Actualiza los datos correspondientes.
  const updateOpcion = (index: number, value: string) => {
    setOpcionesEncuesta((prev) => prev.map((op, i) => (i === index ? value : op)))
  }

  // Crea el registro o elemento correspondiente.
  const addOpcion = () => {
    if (opcionesEncuesta.length < 6) {
      setOpcionesEncuesta((prev) => [...prev, ''])
    }
  }

  // Elimina el elemento indicado.
  const removeOpcion = (index: number) => {
    if (opcionesEncuesta.length <= 2) return
    setOpcionesEncuesta((prev) => prev.filter((_, i) => i !== index))
  }

  // Gestiona la accion correspondiente.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const tituloTrim = titulo.trim()
    const contenidoTrim = contenido.trim()

    if (!tituloTrim || !contenidoTrim) {
      setError('Completá título y mensaje.')
      return
    }

    const sucursalesDestino: string[] = []
    if (sedeMdp) sucursalesDestino.push(SUCURSALES[1])
    if (sedeCaba) sucursalesDestino.push(SUCURSALES[0])
    if (sucursalesDestino.length === 0) {
      setError('Seleccioná al menos una sede destino.')
      return
    }

    let encuestaPayload: CreateNovedadPayload['encuesta'] = null
    if (conEncuesta) {
      const opciones = opcionesEncuesta.map((o) => o.trim()).filter(Boolean)
      const pregunta = preguntaEncuesta.trim()
      if (!pregunta || opciones.length < 2) {
        setError('La encuesta necesita una pregunta y al menos 2 opciones.')
        return
      }
      encuestaPayload = { pregunta, opciones }
    }

    setSubmitting(true)
    try {
      const payload: CreateNovedadPayload = {
        titulo: tituloTrim,
        contenido: contenidoTrim,
        importante,
        imagen_url: imagenData,
        archivo_url: archivo?.url ?? null,
        archivo_nombre: archivo?.nombre ?? null,
        archivo_tipo: archivo?.tipo ?? null,
        destacado_admin_dias: DESTACADO_DIAS,
        encuesta: encuestaPayload,
        sucursales_destino: sucursalesDestino,
      }

      await newsService.create(payload, token)
      setSuccess(true)
      resetForm()
      onPublished?.()
      setTimeout(() => {
        setSuccess(false)
        setOpen(false)
      }, 1400)
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : 'request_failed'
      setError(authErrorMessage(code))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  return (
    <PremiumCard title="Nueva publicación" eyebrow="Comunicación corporativa" icon={Megaphone}>
      {!open ? (
        <button
          type="button"
          className="btn btn-md btn-primary-fill"
          onClick={() => setOpen(true)}
          style={{ borderRadius: 12 }}
        >
          <Sparkles size={16} />
          Crear novedad
        </button>
      ) : (
        <AnimatePresence mode="wait">
          <motion.form
            key="composer-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'grid', gap: 14 }}
          >
            <div className="form-field">
              <label className="form-label">Título</label>
              <input
                className="form-input"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Reunión general de julio"
                maxLength={120}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Mensaje</label>
              <textarea
                className="form-input"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escribí el contenido de la novedad…"
                rows={5}
                style={{ resize: 'vertical', minHeight: 120 }}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Destinatarios por sede</label>
              <div style={{ display: 'grid', gap: 8 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: sedeMdp ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: sedeMdp ? 'rgba(229,57,53,0.06)' : 'var(--card)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sedeMdp}
                    onChange={(e) => setSedeMdp(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {SUCURSALES[1]}
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: sedeCaba ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: sedeCaba ? 'rgba(229,57,53,0.06)' : 'var(--card)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sedeCaba}
                    onChange={(e) => setSedeCaba(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {SUCURSALES[0]} (CABA)
                </label>
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 12,
                border: importante ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: importante ? 'rgba(229,57,53,0.06)' : 'var(--card)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={importante}
                onChange={(e) => setImportante(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              Marcar como importante
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <label className="btn btn-sm btn-ghost" style={{ cursor: 'pointer', borderRadius: 12, justifyContent: 'center' }}>
                <ImagePlus size={15} />
                Imagen
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="btn btn-sm btn-ghost" style={{ cursor: 'pointer', borderRadius: 12, justifyContent: 'center' }}>
                <FileUp size={15} />
                Archivo
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                  hidden
                  onChange={(e) => handleArchivo(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                className={`btn btn-sm ${conEncuesta ? 'btn-primary-fill' : 'btn-ghost'}`}
                style={{ borderRadius: 12, justifyContent: 'center' }}
                onClick={() => setConEncuesta((v) => !v)}
              >
                <BarChart3 size={15} />
                Encuesta
              </button>
            </div>

            {imagenPreview && (
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', maxHeight: 200 }}>
                <img src={imagenPreview} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => { setImagenPreview(null); setImagenData(null) }}
                  className="app-header-btn"
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                  aria-label="Quitar imagen"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {archivo && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <Paperclip size={16} />
                <span style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {archivo.nombre}
                </span>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setArchivo(null)}>
                  <X size={14} />
                </button>
              </div>
            )}

            {conEncuesta && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: '1px dashed var(--border)',
                  background: 'var(--muted)',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div className="form-field" style={{ margin: 0 }}>
                  <label className="form-label">Pregunta de la encuesta</label>
                  <input
                    className="form-input"
                    value={preguntaEncuesta}
                    onChange={(e) => setPreguntaEncuesta(e.target.value)}
                    placeholder="¿Qué te pareció el evento?"
                  />
                </div>
                {opcionesEncuesta.map((op, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-input"
                      value={op}
                      onChange={(e) => updateOpcion(i, e.target.value)}
                      placeholder={`Opción ${i + 1}`}
                    />
                    {opcionesEncuesta.length > 2 && (
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeOpcion(i)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {opcionesEncuesta.length < 6 && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={addOpcion} style={{ alignSelf: 'flex-start' }}>
                    + Agregar opción
                  </button>
                )}
              </div>
            )}

            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
              Después de publicar, podés editar o eliminar la novedad directamente desde el feed.
            </p>

            {error && <div className="auth-error">{error}</div>}
            {success && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 600 }}>
                ¡Novedad publicada con éxito!
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" disabled={submitting} className="btn btn-md btn-primary-fill" style={{ borderRadius: 12 }}>
                <Send size={16} />
                {submitting ? 'Publicando…' : 'Publicar'}
              </button>
              <button type="button" className="btn btn-md btn-ghost" onClick={() => setOpen(false)} disabled={submitting}>
                Cancelar
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      )}
    </PremiumCard>
  )
}
