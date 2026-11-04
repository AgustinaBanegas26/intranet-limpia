import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Eye, ListChecks, Pencil, Plus, Search, Trash2, UserCheck, UserMinus, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth, getInitials } from '../../context/AuthContext'
import { EmployeeDetailModal } from '../../components/employees/EmployeeDetailModal'
import { SectorsAdminPanel } from '../../components/employees/SectorsAdminPanel'
import { AreaSelect, MultiSelectChips } from '../../components/ui/MultiSelectChips'
import { EmptyState, MetricCard, PageHero, PremiumCard } from '../../components/ui/ProductUI'
import {
  EmployeeExpandableItem,
  EmployeeExpandableList,
} from '../../components/employees/EmployeeExpandableItem'
import { employeesService } from '../../services/employees'
import { sectoresService, type SectorDTO } from '../../services/sectores'
import {
  AREAS,
  formatSucursalesStored,
  parseSucursalesStored,
  SUCURSALES,
} from '../../data/profileData'

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

const emptyEmpleado = {
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
}

// Gestiona la operacion EmployeesPage.
export function EmployeesPage() {
  const auth = useAuth()
  const isAdmin = auth.isAdmin
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [sectores, setSectores] = useState<SectorDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [newEmpleado, setNewEmpleado] = useState({ ...emptyEmpleado })
  const [selectedEmployee, setSelectedEmployee] = useState<Empleado | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'delete'>('view')

  const areaOptions = useMemo(
    () => (sectores.length ? sectores.filter((s) => s.activo !== false).map((s) => s.nombre) : AREAS),
    [sectores],
  )

  const reloadSectores = useCallback(async () => {
    try {
      const secRes = await sectoresService.getAll(true)
      setSectores(secRes.data || [])
    } catch {
      // keep current list
    }
  }, [])

  useEffect(() => {
    // Obtiene los datos necesarios.
    async function loadData() {
      if (!auth.token) { setError('No autorizado'); setLoading(false); return }
      setLoading(true)
      setError(null)
      try {
        const [empRes, secRes] = await Promise.all([
          employeesService.getAll(auth.token, showInactive),
          sectoresService.getAll(true).catch(() => ({ data: [] as SectorDTO[] })),
        ])
        setEmpleados(empRes.data || [])
        setSectores(secRes.data || [])
      } catch (err: unknown) {
        console.error('Error al cargar empleados:', err)
        setError('No fue posible obtener la información de empleados.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [auth.token, showInactive])

  const filteredEmpleados = useMemo(() => {
    const lower = query.trim().toLowerCase()
    let list = empleados
    if (!showInactive) {
      list = list.filter((e) => e.activo !== false)
    }
    if (!lower) return list
    return list.filter((emp) => {
      const fullName = `${emp.nombre} ${emp.apellido}`.toLowerCase()
      return (
        fullName.includes(lower) ||
        String(emp.cargo || '').toLowerCase().includes(lower) ||
        String(emp.area || '').toLowerCase().includes(lower) ||
        String(emp.email_corporativo || '').toLowerCase().includes(lower)
      )
    })
  }, [empleados, query, showInactive])

  const activeCount = empleados.filter((e) => e.activo !== false).length
  const inactiveCount = empleados.filter((e) => e.activo === false).length

  const rows = filteredEmpleados.map((emp) => {
    const name = `${emp.nombre} ${emp.apellido}`.trim()
    return {
      key: emp.id,
      emp,
      initials: getInitials(name),
      name,
      foto: emp.foto_url || null,
      role: emp.cargo || '—',
      area: emp.area || '—',
      email: emp.email_corporativo,
      phone: emp.telefono || '—',
      active: emp.activo !== false,
    }
  })

  // Gestiona la operacion openDetail.
  const openDetail = (emp: Empleado, mode: 'view' | 'edit' | 'delete' = 'view') => {
    if (!isAdmin) return
    setModalMode(mode)
    setSelectedEmployee(emp)
  }

  // Gestiona la accion correspondiente.
  const handleEmployeeUpdated = (updated: Empleado) => {
    setEmpleados((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
    setSelectedEmployee((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev))
    setFormSuccess('Empleado actualizado correctamente.')
  }

  // Gestiona la accion correspondiente.
  const handleEmployeeDeleted = async (id: string | number) => {
    setSelectedEmployee(null)
    setFormSuccess('Empleado eliminado correctamente.')
    if (!auth.token) return
    try {
      const empRes = await employeesService.getAll(auth.token, showInactive)
      setEmpleados(empRes.data || [])
    } catch {
      setEmpleados((prev) => prev.filter((e) => String(e.id) !== String(id)))
    }
  }

  // Gestiona la accion correspondiente.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    setSubmitting(true)
    if (!newEmpleado.nombre || !newEmpleado.apellido || !newEmpleado.email_corporativo) {
      setFormError('Nombre, apellido y correo corporativo son obligatorios.')
      setSubmitting(false)
      return
    }
    if (!newEmpleado.area) {
      setFormError('Seleccioná un área.')
      setSubmitting(false)
      return
    }
    if (newEmpleado.sucursales.length === 0) {
      setFormError('Seleccioná al menos una sucursal (máximo 2).')
      setSubmitting(false)
      return
    }
    try {
      const res = await employeesService.create(
        {
          legajo: newEmpleado.legajo,
          nombre: newEmpleado.nombre,
          apellido: newEmpleado.apellido,
          email_corporativo: newEmpleado.email_corporativo,
          cargo: newEmpleado.cargo || null,
          area: newEmpleado.area,
          sucursal: formatSucursalesStored(newEmpleado.sucursales),
          telefono: newEmpleado.telefono || null,
          fecha_nacimiento: newEmpleado.fecha_nacimiento || null,
          fecha_ingreso: newEmpleado.fecha_ingreso || null,
        },
        auth.token,
      )
      setEmpleados((prev) => [res.data as Empleado, ...prev])
      setShowForm(false)
      setNewEmpleado({ ...emptyEmpleado })
      setFormSuccess('Empleado creado correctamente.')
    } catch (err: unknown) {
      console.error('Error al crear empleado:', err)
      setFormError('No se pudo crear el empleado. Intentá de nuevo más tarde.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Administración"
        title="Empleados"
        description="Gestión del personal y datos de contacto del equipo."
      />

      <motion.div className="metric-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <MetricCard label="Total" value={loading ? '…' : empleados.length} detail="Registros cargados" icon={Users} />
        <MetricCard label="Activos" value={loading ? '…' : activeCount} detail="En operación" icon={UserCheck} />
        <MetricCard label="Inactivos" value={loading ? '…' : inactiveCount} detail="Dados de baja" icon={UserMinus} />
      </motion.div>

      {isAdmin && <SectorsAdminPanel onChange={reloadSectores} />}

      {auth.isAdmin && (
        <PremiumCard title="Alta de empleado" icon={Plus}>
          <button
            type="button"
            className={`btn btn-md ${showForm ? 'btn-ghost' : 'btn-primary-fill'}`}
            onClick={() => setShowForm((prev) => !prev)}
          >
            <Plus size={16} />
            {showForm ? 'Cancelar' : 'Agregar empleado'}
          </button>

          {showForm && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.25 }}
              className="employee-create-form"
            >
              <div className="form-field">
                <label className="form-label">Legajo</label>
                <input className="form-input" value={newEmpleado.legajo} onChange={(e) => setNewEmpleado((p) => ({ ...p, legajo: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={newEmpleado.nombre} onChange={(e) => setNewEmpleado((p) => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Apellido</label>
                <input className="form-input" value={newEmpleado.apellido} onChange={(e) => setNewEmpleado((p) => ({ ...p, apellido: e.target.value }))} />
              </div>
              <div className="form-field employee-create-form__full">
                <label className="form-label">Correo corporativo</label>
                <input className="form-input" type="email" value={newEmpleado.email_corporativo} onChange={(e) => setNewEmpleado((p) => ({ ...p, email_corporativo: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Cargo</label>
                <input className="form-input" value={newEmpleado.cargo} onChange={(e) => setNewEmpleado((p) => ({ ...p, cargo: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={newEmpleado.telefono} onChange={(e) => setNewEmpleado((p) => ({ ...p, telefono: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Fecha de nacimiento</label>
                <input type="date" className="form-input" value={newEmpleado.fecha_nacimiento} onChange={(e) => setNewEmpleado((p) => ({ ...p, fecha_nacimiento: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Fecha de ingreso</label>
                <input type="date" className="form-input" value={newEmpleado.fecha_ingreso} onChange={(e) => setNewEmpleado((p) => ({ ...p, fecha_ingreso: e.target.value }))} />
              </div>
              <div className="employee-create-form__full">
                <AreaSelect
                  label="Área"
                  options={areaOptions}
                  value={newEmpleado.area}
                  onChange={(area) => setNewEmpleado((p) => ({ ...p, area }))}
                />
              </div>
              <div className="employee-create-form__full">
                <MultiSelectChips
                  label="Sucursal"
                  hint="Podés seleccionar hasta 2 sucursales."
                  options={SUCURSALES}
                  value={newEmpleado.sucursales}
                  max={2}
                  onChange={(sucursales) => setNewEmpleado((p) => ({ ...p, sucursales }))}
                />
              </div>

              {formError && <div className="auth-error employee-create-form__full">{formError}</div>}

              <button type="submit" disabled={submitting} className="btn btn-md btn-primary-fill employee-create-form__full">
                {submitting ? 'Creando…' : 'Crear empleado'}
              </button>
            </motion.form>
          )}
        </PremiumCard>
      )}

      <PremiumCard title="Listado" icon={ListChecks}>
        <div className="employees-list-toolbar">
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search size={16} className="employees-search-icon" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Buscar por nombre, área, cargo o email…"
              className="form-input employees-search-input"
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

        {formSuccess && <div className="auth-success" style={{ marginBottom: 12 }}>{formSuccess}</div>}

        {loading ? (
          <EmptyState title="Cargando empleados" description="Obteniendo la lista de empleados…" icon={Users} />
        ) : error ? (
          <EmptyState title="Error al cargar los datos" description={error} icon={Users} />
        ) : rows.length === 0 ? (
          <EmptyState title="Sin resultados" description="La búsqueda no encontró empleados." icon={Users} />
        ) : (
          <EmployeeExpandableList>
            {rows.map((row) => (
              <EmployeeExpandableItem
                key={String(row.key)}
                employee={{
                  id: row.key,
                  name: row.name,
                  foto: row.foto,
                  area: row.area === '—' ? null : row.area,
                  cargo: row.role === '—' ? null : row.role,
                  sucursal: row.emp.sucursal,
                  email: row.email,
                  telefono: row.phone === '—' ? null : row.phone,
                  activo: row.active,
                  legajo: row.emp.legajo,
                }}
                showContact
                showFoto={isAdmin}
                headerActions={
                  isAdmin ? (
                    <>
                      <button
                        type="button"
                        className="employee-expandable__icon-btn"
                        onClick={() => openDetail(row.emp, 'edit')}
                        aria-label={`Modificar ${row.name}`}
                        title="Modificar"
                      >
                        <Pencil size={16} strokeWidth={2} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="employee-expandable__icon-btn employee-expandable__icon-btn--danger"
                        onClick={() => openDetail(row.emp, 'delete')}
                        aria-label={`Eliminar ${row.name}`}
                        title="Eliminar"
                      >
                        <Trash2 size={16} strokeWidth={2} aria-hidden />
                      </button>
                    </>
                  ) : undefined
                }
                actions={
                  isAdmin ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost employee-expandable__profile-btn"
                      onClick={() => openDetail(row.emp, 'view')}
                    >
                      <Eye size={14} aria-hidden />
                      Ver ficha completa
                    </button>
                  ) : undefined
                }
              />
            ))}
          </EmployeeExpandableList>
        )}
      </PremiumCard>

      {isAdmin && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          token={auth.token}
          areaOptions={areaOptions}
          initialMode={modalMode}
          onClose={() => {
            setSelectedEmployee(null)
            setModalMode('view')
          }}
          onUpdated={handleEmployeeUpdated}
          onDeleted={handleEmployeeDeleted}
        />
      )}
    </div>
  )
}
