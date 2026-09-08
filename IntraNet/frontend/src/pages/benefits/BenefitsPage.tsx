import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Gift, ImagePlus, Loader2, PlusCircle, Pencil } from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { AdminDeleteButton } from '../../components/ui/AdminDeleteButton'
import { useAuth } from '../../context/AuthContext'
import { benefitsService, type BeneficioDTO } from '../../services/benefits'
import { resizeImageForSlider } from '../../utils/fileUpload'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.3 } }),
}

const COLORS = ['#10B981', '#F59E0B', '#6366F1', '#3B82F6', '#8B5CF6', '#EC4899']

export function BenefitsPage() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState<BeneficioDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [form, setForm] = useState({ nombre: '', descripcion: '', imagen_url: '', enlace_url: '' })
  const [editingId, setEditingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await benefitsService.getAll()
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

  const resetForm = () => {
    setForm({ nombre: '', descripcion: '', imagen_url: '', enlace_url: '' })
    setEditingId(null)
    setShowForm(false)
    setUploadError('')
  }

  const handleImageUpload = async (file: File | null) => {
    if (!file) return
    setUploadingImage(true)
    setUploadError('')
    try {
      const dataUrl = await resizeImageForSlider(file)
      setForm((p) => ({ ...p, imagen_url: dataUrl }))
    } catch {
      setUploadError('No se pudo cargar la imagen.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreate = async () => {
    if (!form.nombre.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        imagen_url: form.imagen_url.trim() || undefined,
        enlace_url: form.enlace_url.trim() || undefined,
      }
      if (editingId) {
        await benefitsService.update(editingId, payload)
      } else {
        await benefitsService.create(payload)
      }
      resetForm()
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (benefit: BeneficioDTO) => {
    setEditingId(benefit.id)
    setForm({
      nombre: benefit.nombre,
      descripcion: benefit.descripcion || '',
      imagen_url: benefit.imagen_url || '',
      enlace_url: benefit.enlace_url || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    setDeleteError('')
    try {
      await benefitsService.remove(id)
      setItems((prev) => prev.filter((b) => b.id !== id))
    } catch {
      setDeleteError('No se pudo eliminar el beneficio.')
      throw new Error('failed_to_delete_beneficio')
    }
  }

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Beneficios"
        title="Tus beneficios"
        description="Aprovechá todos los beneficios y descuentos exclusivos para empleados de Grupo Núcleo."
      />

      {deleteError && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: 12 }}>{deleteError}</p>}

      {isAdmin && (
        <PremiumCard title={editingId ? 'Editar beneficio' : 'Nuevo beneficio'} icon={PlusCircle}>
          <button type="button" className={`btn btn-md ${showForm ? 'btn-ghost' : 'btn-primary-fill'}`} onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? 'Cancelar' : 'Agregar beneficio'}
          </button>
          {showForm && (
            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
              <div className="form-field">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Imagen</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <label className="btn btn-md btn-muted file-upload-btn">
                    {uploadingImage ? <Loader2 size={15} className="spin" /> : <ImagePlus size={15} />}
                    {uploadingImage ? 'Cargando…' : 'Cargar desde dispositivo'}
                    <input type="file" accept="image/*" hidden disabled={uploadingImage} onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)} />
                  </label>
                  {form.imagen_url && (
                    <img src={form.imagen_url} alt="Vista previa" className="benefit-preview-thumb" />
                  )}
                </div>
                <input
                  className="form-input"
                  style={{ marginTop: 8 }}
                  value={form.imagen_url.startsWith('data:') ? '' : form.imagen_url}
                  onChange={(e) => setForm((p) => ({ ...p, imagen_url: e.target.value }))}
                  placeholder="O pegá una URL de imagen (opcional)"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Enlace al beneficio (opcional)</label>
                <input
                  className="form-input"
                  value={form.enlace_url}
                  onChange={(e) => setForm((p) => ({ ...p, enlace_url: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              {uploadError && <div className="auth-error">{uploadError}</div>}
              <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting || uploadingImage} onClick={handleCreate}>
                {submitting ? <Loader2 size={16} className="spin" /> : editingId ? 'Guardar cambios' : 'Publicar'}
              </button>
            </div>
          )}
        </PremiumCard>
      )}

      {loading ? (
        <p style={{ color: 'var(--muted-foreground)' }}>Cargando beneficios…</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--muted-foreground)' }}>No hay beneficios publicados.</p>
      ) : (
        <motion.div className="grid-auto" variants={{ visible: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="visible">
          {items.map((benefit, i) => {
            const color = COLORS[i % COLORS.length]
            return (
              <motion.div key={benefit.id} custom={i} variants={fadeUp}>
                <div className="card card-interactive benefit-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', position: 'relative' }}>
                  {isAdmin && (
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, zIndex: 2 }}>
                      <button type="button" className="btn btn-icon btn-ghost" title="Editar beneficio" onClick={() => handleEdit(benefit)}>
                        <Pencil size={16} />
                      </button>
                      <AdminDeleteButton label="Eliminar beneficio" onConfirm={() => handleDelete(benefit.id)} />
                    </div>
                  )}
                  <div style={{ height: 6, borderRadius: 999, background: color, marginBottom: 4 }} />
                  {benefit.imagen_url && (
                    <div className="benefit-card-image-wrap">
                      <img src={benefit.imagen_url} alt={benefit.nombre} className="benefit-card-image" />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, lineHeight: 1.25 }}>{benefit.nombre}</h3>
                    <Gift size={18} style={{ color, flexShrink: 0 }} />
                  </div>
                  {benefit.descripcion && (
                    <p style={{ margin: 0, fontSize: '0.8375rem', color: 'var(--muted-foreground)', lineHeight: 1.6, flex: 1 }}>
                      {benefit.descripcion}
                    </p>
                  )}
                  {benefit.enlace_url && (
                    <a href={benefit.enlace_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary-fill benefit-link-btn">
                      <ArrowUpRight size={14} />
                      Ir al beneficio
                    </a>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
