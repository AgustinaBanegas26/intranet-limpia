import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  PlusCircle,
  Loader2,
  Upload,
  Pencil,
} from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { AdminDeleteButton } from '../../components/ui/AdminDeleteButton'
import { AlertDialog } from '../../components/ui/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import { manualsService, type ManualDTO } from '../../services/manuals'
import { readPdfAsDataUrl } from '../../utils/fileUpload'

const COLORS = ['#6366F1', '#F59E0B', '#E53935', '#3B82F6', '#EC4899', '#EF4444', '#10B981']

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d.includes('T') ? d : `${d}T00:00:00`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export function ManualsPage() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState<ManualDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ titulo: '', descripcion: '', categoria: 'general', archivo_url: '', version: '1.0', paginas: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pdfName, setPdfName] = useState('')
  const [pdfError, setPdfError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await manualsService.getAll()
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

  const categories = useMemo(() => {
    const cats = new Set<string>()
    items.forEach((m) => {
      if (m.categoria) cats.add(m.categoria.toLowerCase())
    })
    return Array.from(cats).sort()
  }, [items])

  const filtered = items.filter((m) => {
    const cat = (m.categoria || 'general').toLowerCase()
    const matchesCategory = activeCategory === 'todos' || cat === activeCategory
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || m.titulo.toLowerCase().includes(q) || (m.descripcion || '').toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  const resetForm = () => {
    setForm({ titulo: '', descripcion: '', categoria: 'general', archivo_url: '', version: '1.0', paginas: '' })
    setEditingId(null)
    setPdfName('')
    setShowForm(false)
  }

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readPdfAsDataUrl(file)
      setForm((prev) => ({ ...prev, archivo_url: dataUrl }))
      setPdfName(file.name)
    } catch {
      setPdfError('No se pudo cargar el PDF. Verificá que sea un archivo PDF de hasta 8 MB.')
    }
    event.target.value = ''
  }

  const handleCreate = async () => {
    if (!form.titulo.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        categoria: form.categoria.trim() || 'general',
        archivo_url: form.archivo_url.trim() || undefined,
        version: form.version.trim() || undefined,
        paginas: form.paginas ? Number(form.paginas) : undefined,
      }
      if (editingId) {
        await manualsService.update(editingId, payload)
      } else {
        await manualsService.create(payload)
      }
      resetForm()
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (manual: ManualDTO) => {
    setEditingId(manual.id)
    setForm({
      titulo: manual.titulo,
      descripcion: manual.descripcion || '',
      categoria: manual.categoria || 'general',
      archivo_url: manual.archivo_url || '',
      version: manual.version || '1.0',
      paginas: manual.paginas ? String(manual.paginas) : '',
    })
    setPdfName(manual.archivo_url ? 'PDF cargado' : '')
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    await manualsService.remove(id)
    setItems((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Documentación"
        title="Manuales"
        description="Accedé a los manuales, guías y documentación oficial de Grupo Núcleo."
      />

      {isAdmin && (
        <PremiumCard title={editingId ? 'Editar manual' : 'Nuevo manual'} icon={PlusCircle}>
          <button type="button" className={`btn btn-md ${showForm ? 'btn-ghost' : 'btn-primary-fill'}`} onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? 'Cancelar' : 'Agregar manual'}
          </button>
          {showForm && (
            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
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
                  <label className="form-label">Categoría</label>
                  <input className="form-input" value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Versión</label>
                  <input className="form-input" value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-field">
                  <label className="form-label">Archivo PDF</label>
                  <label className="btn btn-md btn-muted file-upload-btn">
                    <Upload size={15} />
                    {pdfName || 'Subir PDF'}
                    <input type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} hidden />
                  </label>
                </div>
                <div className="form-field">
                  <label className="form-label">URL archivo (opcional)</label>
                  <input className="form-input" value={form.archivo_url.startsWith('data:') ? '' : form.archivo_url} onChange={(e) => setForm((p) => ({ ...p, archivo_url: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Páginas</label>
                <input type="number" className="form-input" value={form.paginas} onChange={(e) => setForm((p) => ({ ...p, paginas: e.target.value }))} />
              </div>
              <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting} onClick={handleCreate}>
                {submitting ? <Loader2 size={16} className="spin" /> : editingId ? 'Guardar cambios' : 'Publicar'}
              </button>
            </div>
          )}
        </PremiumCard>
      )}

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
        <input
          type="search"
          className="form-input"
          style={{ paddingLeft: 40 }}
          placeholder="Buscar manuales…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div className="chip-row">
          <button type="button" className={`chip ${activeCategory === 'todos' ? 'active' : ''}`} onClick={() => setActiveCategory('todos')}>
            Todos
          </button>
          {categories.map((cat) => (
            <button key={cat} type="button" className={`chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--muted-foreground)' }}>Cargando manuales…</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state-desc">No encontramos manuales que coincidan con tu búsqueda.</p>
      ) : (
        <motion.div style={{ display: 'grid', gap: 12 }} initial="hidden" animate="visible">
          {filtered.map((manual, i) => {
            const color = COLORS[i % COLORS.length]
            return (
              <motion.div key={manual.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card card-interactive" style={{ padding: 16, position: 'relative' }}>
                {isAdmin && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                    <button type="button" className="btn btn-icon btn-ghost" title="Editar manual" onClick={() => handleEdit(manual)}>
                      <Pencil size={16} />
                    </button>
                    <AdminDeleteButton label="Eliminar manual" onConfirm={() => handleDelete(manual.id)} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800 }}>{manual.titulo}</h3>
                      {manual.version && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${color}15`, color }}>{manual.version}</span>}
                    </div>
                    {manual.descripcion && <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', lineHeight: 1.55 }}>{manual.descripcion}</p>}
                    <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                      <FileText size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {(manual.categoria || 'general').toString()} · {manual.paginas ? `${manual.paginas} págs` : '—'} · Actualizado {fmtDate(manual.updated_at || manual.created_at)}
                    </p>
                    {manual.archivo_url && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <a href={manual.archivo_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
                          <Download size={12} /> Descargar
                        </a>
                        <a href={manual.archivo_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-muted">
                          <ExternalLink size={12} /> Ver
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <AlertDialog
        open={pdfError != null}
        title="No se pudo cargar el PDF"
        description={pdfError ?? undefined}
        variant="danger"
        onClose={() => setPdfError(null)}
      />
    </div>
  )
}
