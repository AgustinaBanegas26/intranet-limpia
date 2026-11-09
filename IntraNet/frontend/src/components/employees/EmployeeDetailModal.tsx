// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: información y gestión de empleados.
import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Mail, Pencil, Trash2, UserCircle, X } from 'lucide-react'
import { getInitials } from '../../context/AuthContext'
import { employeesService } from '../../services/employees'
import type { ProfileData } from '../../services/profile'
import { PremiumCard } from '../ui/ProductUI'
import { ModalBackdrop } from '../ui/ModalBackdrop'
import { AreaSelect, MultiSelectChips } from '../ui/MultiSelectChips'
import { formatSucursalesStored, parseSucursalesStored, SUCURSALES } from '../../data/profileData'

type Empleado = {
  id: string | number
  legajo?: string | number
  nombre: string
  apellido: string
  email_corporativo: string
  cargo?: string | null
  area?: string | null
  sucursal?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  fecha_ingreso?: string | null
  foto_url?: string | null
  activo?: boolean
  es_director?: boolean
  work_mode?: string | null
}

// Gestiona la operacion DetailField.
function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  const filled = value != null && String(value).trim() !== ''
  return (
    <div className="profile-field complete">
      <div>
        <span>{label}</span>
        <strong>{filled ? value : 'Sin completar'}</strong>
      </div>
    </div>
  )
}

// Prepara el valor para su uso.
function normalizePersonName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

// Construye el valor o recurso necesario.
function buildFullName(employee: Empleado) {
  return `${employee.nombre} ${employee.apellido}`.trim().replace(/\s+/g, ' ')
}

type Props = {
  employee: Empleado | null
  token: string | null
  areaOptions?: string[]
  initialMode?: 'view' | 'edit' | 'delete'
  onClose: () => void
  onUpdated: (emp: Empleado) => void
  onDeleted: (id: string | number) => void
}

// Gestiona la operacion EmployeeDetailModal.
export function EmployeeDetailModal({ employee, token, areaOptions = [], initialMode = 'view', onClose, onUpdated, onDeleted }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    legajo: '',
    nombre: '',
    apellido: '',
    email_corporativo: '',
    cargo: '',
    area: '',
    sucursales: [] as string[],
    telefono: '',
    fecha_nacimiento: '',
    fecha_ingreso: '',
    activo: true,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fullName = employee ? buildFullName(employee) : ''
  const deleteNameMatches = normalizePersonName(deleteConfirmText) === normalizePersonName(fullName)

  useEffect(() => {
    if (!employee || !token) return
    setEditing(initialMode === 'edit')
    setConfirmDelete(initialMode === 'delete')
    setDeleteConfirmText('')
    setDeleteError(null)
    setSaveError(null)
    setForm({
      legajo: String(employee.legajo ?? ''),
      nombre: employee.nombre,
      apellido: employee.apellido,
      email_corporativo: employee.email_corporativo,
      cargo: employee.cargo || '',
      area: employee.area || '',
      sucursales: parseSucursalesStored(employee.sucursal),
      telefono: employee.telefono || '',
      fecha_nacimiento: employee.fecha_nacimiento || '',
      fecha_ingreso: employee.fecha_ingreso || '',
      activo: employee.activo !== false,
    })

    setProfile(null)
    setProfileError(null)
    setProfileLoading(true)
    employeesService
      .getPersonalProfile(employee.id, token)
      .then((res) => setProfile(res.data))
      .catch(() => {
        setProfileError('No se pudo cargar el perfil del empleado.')
      })
      .finally(() => setProfileLoading(false))
  }, [employee, token, initialMode])

  useEffect(() => {
    if (!employee) return
    // Gestiona la accion correspondiente.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmDelete) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [employee, confirmDelete, onClose])

  if (!employee) return null

  const foto = profile?.foto || employee.foto_url || null

  // Gestiona la accion correspondiente.
  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!form.nombre.trim() || !form.apellido.trim() || !form.email_corporativo.trim()) {
      setSaveError('Nombre, apellido y correo corporativo son obligatorios.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const res = await employeesService.update(
        employee.id,
        {
          legajo: form.legajo || undefined,
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email_corporativo: form.email_corporativo.trim(),
          cargo: form.cargo.trim() || null,
          area: form.area.trim() || null,
          sucursal: formatSucursalesStored(form.sucursales),
          telefono: form.telefono.trim() || null,
          fecha_nacimiento: form.fecha_nacimiento || null,
          fecha_ingreso: form.fecha_ingreso || null,
          activo: form.activo,
        },
        token,
      )
      onUpdated(res.data as Empleado)
      setEditing(false)
    } catch {
      setSaveError('No se pudo guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async () => {
    if (!token || !deleteNameMatches) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await employeesService.remove(employee.id, token)
      onDeleted(employee.id)
      onClose()
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : 'failed_to_deactivate_empleado'
      const message =
        code === 'forbidden'
          ? 'No tenés permisos para eliminar empleados.'
          : code === 'cannot_delete_self'
            ? 'No podés eliminar tu propia cuenta.'
          : code === 'not_found'
            ? 'No se encontró el empleado.'
            : code === 'invalid_id'
              ? 'Identificador de empleado inválido.'
            : 'No se pudo eliminar al empleado. Intentá de nuevo.'
      setDeleteError(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ModalBackdrop role="dialog" aria-modal="true" onClick={onClose}>
      <div className="profile-modal employee-detail-modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="page-kicker">Ficha de empleado</p>
            <h3>{fullName}</h3>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="profile-photo" style={{ width: 88, height: 88, cursor: 'default' }}>
            {foto ? <img src={foto} alt={fullName} /> : getInitials(fullName)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{fullName}</p>
            <p style={{ margin: '4px 0 0', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
              {[employee.cargo, employee.area, employee.sucursal].filter(Boolean).join(' · ') || 'Sin datos laborales'}
            </p>
            <span className={`employee-expandable__status ${employee.activo !== false ? 'status-success' : 'status-danger'}`} style={{ marginTop: 8, display: 'inline-block' }}>
              {employee.activo !== false ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {!editing && !confirmDelete && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing(true)}>
                <Pencil size={14} />
                Modificar
              </button>
              <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          )}
        </div>

        {saveError && <div className="auth-error" style={{ marginBottom: 12 }}>{saveError}</div>}

        {confirmDelete ? (
          <div className="employee-delete-confirm">
            <h4>Confirmar eliminación</h4>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: '8px 0 16px' }}>
              Esta acción eliminará permanentemente a <strong>{fullName}</strong> de la base de datos, junto con sus solicitudes y notificaciones. Escribí el nombre completo para confirmar.
            </p>
            <input
              className="form-input"
              value={deleteConfirmText}
              onChange={(e) => {
                setDeleteConfirmText(e.target.value)
                setDeleteError(null)
              }}
              placeholder={fullName}
              autoFocus
            />
            {!deleteNameMatches && deleteConfirmText.trim() !== '' && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', margin: '8px 0 0' }}>
                El nombre no coincide. Debe ser exactamente: <strong>{fullName}</strong>
              </p>
            )}
            {deleteError && (
              <div className="auth-error" style={{ marginTop: 12 }}>{deleteError}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-md btn-ghost" onClick={() => { setConfirmDelete(false); setDeleteConfirmText(''); setDeleteError(null) }}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-md btn-danger-fill"
                disabled={deleting || !deleteNameMatches}
                onClick={handleDelete}
              >
                {deleting ? <Loader2 size={16} className="spin" /> : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        ) : editing ? (
          <form onSubmit={handleSave} className="employee-edit-form">
            <div className="form-field">
              <label className="form-label">Legajo</label>
              <input className="form-input" value={form.legajo} onChange={(e) => setForm((p) => ({ ...p, legajo: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Nombre</label>
              <input className="form-input" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Apellido</label>
              <input className="form-input" value={form.apellido} onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))} />
            </div>
            <div className="form-field employee-edit-form__full">
              <label className="form-label">Correo corporativo</label>
              <input className="form-input" type="email" value={form.email_corporativo} onChange={(e) => setForm((p) => ({ ...p, email_corporativo: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Cargo</label>
              <input className="form-input" value={form.cargo} onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Fecha de nacimiento</label>
              <input type="date" className="form-input" value={form.fecha_nacimiento} onChange={(e) => setForm((p) => ({ ...p, fecha_nacimiento: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Fecha de ingreso</label>
              <input type="date" className="form-input" value={form.fecha_ingreso} onChange={(e) => setForm((p) => ({ ...p, fecha_ingreso: e.target.value }))} />
            </div>
            <div className="employee-edit-form__full">
              <AreaSelect options={areaOptions} value={form.area} onChange={(area) => setForm((p) => ({ ...p, area }))} />
            </div>
            <div className="employee-edit-form__full">
              <MultiSelectChips
                label="Sucursal"
                hint="Máximo 2 sucursales."
                options={SUCURSALES}
                value={form.sucursales}
                max={2}
                onChange={(sucursales) => setForm((p) => ({ ...p, sucursales }))}
              />
            </div>
            <label className="form-field employee-edit-form__full" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span className="form-label" style={{ margin: 0 }}>Empleado activo</span>
            </label>
            <div className="employee-edit-form__full" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-md btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
              <button type="submit" className="btn btn-md btn-primary-fill" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : 'Guardar cambios'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <PremiumCard title="Datos laborales" icon={UserCircle}>
              <DetailField label="Legajo" value={employee.legajo} />
              <DetailField label="Cargo" value={employee.cargo} />
              <DetailField label="Área / Sector" value={employee.area} />
              <DetailField label="Sucursal" value={employee.sucursal} />
              <DetailField label="Modo de trabajo" value={employee.work_mode} />
              <DetailField label="Director" value={employee.es_director ? 'Sí' : 'No'} />
            </PremiumCard>

            <div style={{ marginTop: 12 }}>
              <PremiumCard title="Contacto laboral" icon={Mail}>
                <DetailField label="Email corporativo" value={employee.email_corporativo} />
                <DetailField label="Teléfono" value={employee.telefono} />
              </PremiumCard>
            </div>

            {profileLoading ? (
              <p style={{ color: 'var(--muted-foreground)', marginTop: 16 }}>Cargando datos personales…</p>
            ) : profileError ? (
              <p style={{ color: 'var(--muted-foreground)', marginTop: 16, fontSize: '0.875rem' }}>{profileError}</p>
            ) : profile ? (
              <>
                <div style={{ marginTop: 12 }}>
                  <PremiumCard title="Información personal" icon={UserCircle}>
                    <DetailField label="Fecha de nacimiento" value={profile.fechaNac} />
                    <DetailField label="Estado civil" value={profile.estadoCivil} />
                    <DetailField label="Hijos" value={profile.hijos} />
                    <DetailField label="DNI" value={profile.documento} />
                    <DetailField label="CUIL" value={profile.cuil} />
                    <DetailField label="Domicilio" value={profile.domicilio} />
                  </PremiumCard>
                </div>
                <div style={{ marginTop: 12 }}>
                  <PremiumCard title="Contacto personal" icon={Mail}>
                    <DetailField label="Email personal" value={profile.emailPersonal} />
                    <DetailField label="Teléfono personal" value={profile.tel} />
                    <DetailField label="Celular" value={profile.celPersonal} />
                  </PremiumCard>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </ModalBackdrop>
  )
}
