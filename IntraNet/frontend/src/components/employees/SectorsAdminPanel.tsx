import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Accordion } from '../ui/Accordion'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { sectoresService, type SectorDTO } from '../../services/sectores'

export function SectorsAdminPanel({ onChange }: { onChange?: () => void }) {
  const [items, setItems] = useState<SectorDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await sectoresService.getAll(showInactive)
      setItems(res.data || [])
    } catch {
      setItems([])
      setError('No se pudieron cargar los sectores.')
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    load()
  }, [load])

  const sectorErrorMessage = (err: unknown, fallback: string) => {
    const code = err instanceof Error ? err.message : ''
    if (code === 'duplicate_name') return 'Ya existe un sector con ese nombre.'
    if (code === 'forbidden') return 'No tenés permisos para gestionar sectores.'
    return fallback
  }

  const handleCreate = async () => {
    const nombre = newName.trim()
    if (!nombre) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await sectoresService.create(nombre)
      setNewName('')
      setSuccess('Sector creado correctamente.')
      await load()
      onChange?.()
    } catch (err) {
      setError(sectorErrorMessage(err, 'No se pudo crear el sector.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (editId == null || !editName.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await sectoresService.update(editId, { nombre: editName.trim() })
      setEditId(null)
      setEditName('')
      setSuccess('Sector actualizado.')
      await load()
      onChange?.()
    } catch {
      setError('No se pudo actualizar el sector.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await sectoresService.remove(id)
      setDeleteId(null)
      setItems((prev) => prev.filter((s) => s.id !== id))
      setSuccess('Sector eliminado.')
      await load()
      onChange?.()
    } catch {
      setError('No se pudo eliminar el sector.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeCount = items.filter((s) => s.activo !== false).length

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((s) => s.nombre.toLowerCase().includes(q))
  }, [items, search])

  return (
    <div className="bc-card bc-card--accordion-standalone" style={{ marginBottom: 20 }}>
      <Accordion title="Sectores" count={activeCount} defaultOpen={false}>
        <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
          Gestioná los sectores disponibles para empleados y filtros del sistema.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ flex: '1 1 200px' }}
            placeholder="Nuevo sector…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting || !newName.trim()} onClick={handleCreate}>
            <Plus size={15} />
            Crear
          </button>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', margin: '0 0 10px' }}>{error}</p>}
        {success && <p style={{ color: 'var(--success)', fontSize: '0.8125rem', margin: '0 0 10px' }}>{success}</p>}

        {!loading && items.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
              <Search size={16} className="employees-search-icon" />
              <input
                type="search"
                className="form-input employees-search-input"
                placeholder="Buscar sector…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="employees-filter-inactive">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              Mostrar inactivos
            </label>
          </div>
        )}

        <div className="admin-list">
          {loading ? (
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Cargando sectores…</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>No hay sectores registrados.</p>
          ) : filteredItems.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Ningún sector coincide con la búsqueda.</p>
          ) : (
            filteredItems.map((sector) => (
              <div key={sector.id} className="admin-list-row admin-list-row--no-thumb">
                <div className="admin-list-row__body">
                  {editId === sector.id ? (
                    <input
                      className="form-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <strong>{sector.nombre}</strong>
                      <span>{sector.activo === false ? 'Inactivo' : 'Activo'}</span>
                    </>
                  )}
                </div>
                <div className="admin-list-row__actions">
                  {editId === sector.id ? (
                    <>
                      <button type="button" className="btn btn-sm btn-primary-fill" disabled={submitting} onClick={handleSaveEdit}>
                        Guardar
                      </button>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setEditId(null); setEditName('') }}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => { setEditId(sector.id); setEditName(sector.nombre) }}
                        aria-label={`Editar ${sector.nombre}`}
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeleteId(sector.id)}
                        aria-label={`Eliminar ${sector.nombre}`}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <ConfirmDialog
          open={deleteId != null}
          title="¿Eliminar sector?"
          description="El sector dejará de aparecer en los selectores del sistema."
          confirmLabel="Eliminar"
          loading={submitting}
          onCancel={() => setDeleteId(null)}
          onConfirm={async () => { if (deleteId != null) await handleDelete(deleteId) }}
        />
      </Accordion>
    </div>
  )
}
