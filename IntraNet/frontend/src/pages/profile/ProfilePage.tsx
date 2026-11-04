import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  LockKeyhole,
  MonitorDown,
  ShieldCheck,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, getInitials } from "../../context/AuthContext";
import {
  getProfile,
  updateProfile,
  type ProfileData,
} from "../../services/profile";
import { ESTADOS_CIVILES, SUCURSALES } from "../../data/profileData";
import { sectoresService, type SectorDTO } from "../../services/sectores";
import { PremiumCard } from "../../components/ui/ProductUI";
import { ModalBackdrop } from "../../components/ui/ModalBackdrop";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { InstallAppButton } from "../../components/InstallAppButton";
import { ChangePasswordModal } from "../../components/profile/ChangePasswordModal";
import { ProfileAbsencesAccordion } from "../../components/profile/ProfileAbsencesAccordion";
import { setSession, getSession } from "../../services/auth";
import { resizeImageForAvatar } from "../../utils/fileUpload";

const EMPTY_FORM: Required<Omit<ProfileData, "foto">> & {
  foto: string | null;
} = {
  nombreCompleto: "",
  fechaNac: "",
  tel: "",
  celPersonal: "",
  emailEmpresa: "",
  emailPersonal: "",
  estadoCivil: "Soltero/a",
  domicilio: "",
  documento: "",
  hijos: "0",
  cuil: "",
  sector: "",
  sucursal: "",
  legajo: "",
  fechaIngreso: "",
  foto: null,
};

const requiredFields: Array<keyof typeof EMPTY_FORM> = [
  "nombreCompleto",
  "fechaNac",
  "tel",
  "documento",
  "domicilio",
  "cuil",
  "emailEmpresa",
];

// Prepara el valor para su uso.
function normalizeDateInput(value?: string | null) {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value;
}

// Comprueba los datos o la condicion indicada.
function validate(form: typeof EMPTY_FORM) {
  const errors: Partial<Record<keyof typeof EMPTY_FORM, string>> = {};
  if (!String(form.nombreCompleto || "").trim())
    errors.nombreCompleto = "El nombre es obligatorio.";
  if (form.documento && !/^\d{7,9}$/.test(form.documento))
    errors.documento = "DNI solo numeros, 7 a 9 digitos.";
  if (form.cuil && !/^\d{2}-?\d{8}-?\d$/.test(form.cuil))
    errors.cuil = "CUIL invalido.";
  if (
    form.emailPersonal &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailPersonal)
  )
    errors.emailPersonal = "Email invalido.";
  if (
    form.emailEmpresa &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailEmpresa)
  )
    errors.emailEmpresa = "Email corporativo invalido.";
  if (form.fechaNac && new Date(form.fechaNac) > new Date())
    errors.fechaNac = "La fecha no puede ser futura.";
  if (form.fechaIngreso && new Date(form.fechaIngreso) > new Date())
    errors.fechaIngreso = "La fecha no puede ser futura.";
  if (form.tel && !/^[0-9+\-\s()]{7,20}$/.test(form.tel))
    errors.tel = "Telefono invalido.";
  if (form.celPersonal && !/^[0-9+\-\s()]{7,20}$/.test(form.celPersonal))
    errors.celPersonal = "Celular invalido.";
  return errors;
}

// Gestiona la operacion FieldValue.
function FieldValue({
  label,
  value,
  required = false,
}: {
  label: string;
  value?: string | number | null;
  required?: boolean;
}) {
  const filled = value != null && String(value).trim() !== "";
  const status = filled ? "complete" : required ? "required" : "optional";
  const statusText = filled
    ? "Completo"
    : required
      ? "Obligatorio pendiente"
      : "Opcional pendiente";

  return (
    <div className={`profile-field ${status}`}>
      <div>
        <span>{label}</span>
        <strong>{filled ? value : "Sin completar"}</strong>
      </div>
      <em>{statusText}</em>
    </div>
  );
}

// Actualiza los datos correspondientes.
function EditInput({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      <input
        className={`form-input ${error ? "invalid" : ""}`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <small className="form-feedback">{error}</small>}
    </label>
  );
}

// Gestiona la operacion ProfilePage.
export function ProfilePage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [draft, setDraft] = useState({ ...EMPTY_FORM });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectores, setSectores] = useState<SectorDTO[]>([]);
  const [loadingSectores, setLoadingSectores] = useState(false);
  const [sectoresError, setSectoresError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [confirmPhotoRemove, setConfirmPhotoRemove] = useState(false);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then((data) => {
        const next = {
          nombreCompleto: data.nombreCompleto || user.name || "",
          fechaNac: normalizeDateInput(data.fechaNac),
          tel: data.tel || "",
          celPersonal: data.celPersonal || data.tel || "",
          emailEmpresa: data.emailEmpresa || user.email || "",
          emailPersonal: data.emailPersonal || "",
          estadoCivil: data.estadoCivil || "Soltero/a",
          domicilio: data.domicilio || "",
          documento: data.documento || "",
          hijos: String(data.hijos || "0"),
          cuil: data.cuil || "",
          sector: data.sector || "",
          sucursal: data.sucursal || "",
          legajo: data.legajo ? String(data.legajo) : "",
          fechaIngreso: normalizeDateInput(data.fechaIngreso),
          foto: data.foto || user.foto || null,
        };
        setForm(next);
        setDraft(next);
      })
      .catch(() => {
        const fallback = {
          ...EMPTY_FORM,
          nombreCompleto: user.name,
          emailEmpresa: user.email || "",
          foto: user.foto || null,
        };
        setForm(fallback);
        setDraft(fallback);
      });
  }, [token, user]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoadingSectores(true);
    setSectoresError(null);

    sectoresService
      .getAll()
      .then((response) => {
        if (!cancelled) setSectores(response.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setSectores([]);
          setSectoresError("No se pudieron cargar los sectores disponibles.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSectores(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const errors = useMemo(() => validate(draft), [draft]);
  const sectorOptions = useMemo(() => {
    const activeSectors = sectores.filter((sector) => sector.activo !== false);
    const selectedSectorIsAvailable = activeSectors.some(
      (sector) => sector.nombre === draft.sector,
    );

    if (draft.sector && !selectedSectorIsAvailable) {
      return [
        { id: `current-${draft.sector}`, nombre: draft.sector, activo: false },
        ...activeSectors,
      ];
    }

    return activeSectors;
  }, [draft.sector, sectores]);
  const missing = requiredFields.filter(
    (field) => !String(form[field] || "").trim(),
  );
  const completed = Object.entries(form).filter(([, value]) =>
    String(value || "").trim(),
  ).length;
  const completion = Math.round(
    (completed / Object.keys(EMPTY_FORM).length) * 100,
  );
  const initials = getInitials(form.nombreCompleto || user.name);

  // Actualiza los datos correspondientes.
  const setDraftValue = (key: keyof typeof EMPTY_FORM) => (value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // Gestiona la operacion syncUserProfile.
  const syncUserProfile = (data: typeof EMPTY_FORM) => {
    const session = getSession();
    if (!session) return;
    const nextUser = {
      ...session.user,
      name: data.nombreCompleto || session.user.name,
      email: data.emailEmpresa || session.user.email,
      foto: data.foto,
    };
    setSession({ token: session.token, user: nextUser });
    window.dispatchEvent(
      new CustomEvent("portal:user-updated", { detail: nextUser }),
    );
  };

  // Gestiona la operacion syncUserPhoto.
  const syncUserPhoto = (foto: string | null) => {
    syncUserProfile({ ...form, foto });
  };

  // Gestiona la accion correspondiente.
  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !token) return;

    const previousFoto = form.foto;
    setSaving(true);
    setMessage(null);

    try {
      const value = await resizeImageForAvatar(file);
      setDraft((prev) => ({ ...prev, foto: value }));
      setForm((prev) => ({ ...prev, foto: value }));

      const saved = await updateProfile(token, { foto: value });
      const foto = saved.foto ?? value;
      setForm((prev) => ({ ...prev, foto }));
      setDraft((prev) => ({ ...prev, foto }));
      syncUserPhoto(foto);
      setMessage({ ok: true, text: "Foto de perfil actualizada." });
    } catch (err) {
      setForm((prev) => ({ ...prev, foto: previousFoto }));
      setDraft((prev) => ({ ...prev, foto: previousFoto }));
      const code = err instanceof Error ? err.message : "profile_update_failed";
      const text =
        code === "foto_too_large" || code === "file_too_large"
          ? "La imagen es demasiado grande. Probá con otra foto."
          : code === "invalid_file_type" || code === "invalid_image"
            ? "El archivo debe ser una imagen válida."
            : "No se pudo guardar la foto. Intentá de nuevo.";
      setMessage({ ok: false, text });
    } finally {
      setSaving(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handlePhotoRemove = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile(token, { foto: "" });
      setForm((prev) => ({ ...prev, foto: null }));
      setDraft((prev) => ({ ...prev, foto: null }));
      syncUserPhoto(null);
      setMessage({ ok: true, text: "Foto de perfil eliminada." });
      setConfirmPhotoRemove(false);
    } catch {
      setMessage({ ok: false, text: "No se pudo eliminar la foto." });
    } finally {
      setSaving(false);
    }
  };

  // Actualiza los datos correspondientes.
  const save = async () => {
    if (!token || Object.keys(errors).length > 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const saved = await updateProfile(token, draft);
      const next = {
        ...draft,
        nombreCompleto: saved.nombreCompleto || draft.nombreCompleto,
        emailEmpresa: saved.emailEmpresa || draft.emailEmpresa,
        sector: saved.sector || draft.sector,
        sucursal: saved.sucursal || draft.sucursal,
        legajo: saved.legajo != null ? String(saved.legajo) : draft.legajo,
        fechaIngreso: saved.fechaIngreso || draft.fechaIngreso,
        foto: saved.foto ?? draft.foto,
      };
      setForm(next);
      setDraft(next);
      setEditing(false);
      syncUserProfile(next);
      setMessage({ ok: true, text: "Perfil actualizado correctamente." });
    } catch (err) {
      const code = err instanceof Error ? err.message : "profile_update_failed";
      const userMessage = (err as Error & { userMessage?: string }).userMessage;
      setMessage({
        ok: false,
        text:
          userMessage ||
          (code === "invalid_email"
            ? "Revisá los emails ingresados."
            : "No se pudieron guardar los cambios."),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="profile-modern page-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <section className="profile-summary">
        <div className="profile-photo-wrap">
          <label className="profile-photo">
            {form.foto ? (
              <img src={form.foto} alt={form.nombreCompleto} />
            ) : (
              initials
            )}
            <Camera size={16} />
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={saving}
            />
          </label>
          {form.foto && (
            <button
              type="button"
              className="btn btn-sm btn-ghost profile-photo-remove"
              onClick={() => setConfirmPhotoRemove(true)}
              disabled={saving}
            >
              <Trash2 size={14} />
              Eliminar foto
            </button>
          )}
        </div>
        <div className="profile-summary-main">
          <p className="page-kicker">Mi perfil</p>
          <h2>{form.nombreCompleto || user.name}</h2>
          <p>
            {[
              form.sector || "Sector no informado",
              form.sucursal || "Sucursal no informada",
            ].join(" · ")}
          </p>
          <div className="profile-meta">
            <span>Sector: {form.sector || "No informado"}</span>
            <span>Sucursal: {form.sucursal || "No informada"}</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-md btn-primary-fill"
          onClick={() => {
            setDraft(form);
            setEditing(true);
          }}
        >
          Editar Perfil
        </button>
      </section>

      {message && (
        <div className={message.ok ? "auth-success" : "auth-error"}>
          {message.text}
        </div>
      )}

      <PremiumCard
        title={`Perfil completado: ${completion}%`}
        eyebrow="Completitud"
        icon={CheckCircle2}
      >
        <div className="profile-progress">
          <span style={{ width: `${completion}%` }} />
        </div>
        <div className="missing-list">
          {missing.length === 0 ? (
            <span>Todos los campos obligatorios estan completos.</span>
          ) : (
            missing.map((field) => (
              <span key={field}>Falta completar: {field}</span>
            ))
          )}
        </div>
      </PremiumCard>

      <div className="profile-card-grid">
        <PremiumCard title="Informacion Personal" icon={UserCircle}>
          <FieldValue label="Nombre" value={form.nombreCompleto} />
          <FieldValue
            label="Fecha de nacimiento"
            value={form.fechaNac}
            required
          />
          <FieldValue label="Estado civil" value={form.estadoCivil} />
          <FieldValue label="Hijos" value={form.hijos} />
        </PremiumCard>

        <PremiumCard title="Contacto" icon={UserCircle}>
          <FieldValue
            label="Email corporativo (Gmail)"
            value={form.emailEmpresa}
          />
          <FieldValue label="Email personal" value={form.emailPersonal} />
          <FieldValue label="Telefono" value={form.tel} required />
          <FieldValue label="Celular personal" value={form.celPersonal} />
        </PremiumCard>

        <PremiumCard title="Documentacion" icon={ShieldCheck}>
          <FieldValue label="DNI" value={form.documento} required />
          <FieldValue label="CUIL" value={form.cuil} required />
          <FieldValue label="Domicilio" value={form.domicilio} required />
        </PremiumCard>

        <PremiumCard title="Informacion Laboral" icon={ShieldCheck}>
          <FieldValue label="Sector" value={form.sector} />
          <FieldValue label="Sucursal" value={form.sucursal} />
          <FieldValue
            label="Fecha de ingreso"
            value={
              form.fechaIngreso
                ? new Date(
                    form.fechaIngreso.includes("T")
                      ? form.fechaIngreso
                      : `${form.fechaIngreso}T00:00:00`,
                  ).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "No informado"
            }
          />
          <FieldValue
            label="Legajo"
            value={form.legajo?.trim() || "No informado"}
          />
        </PremiumCard>
      </div>

      <ProfileAbsencesAccordion />

      <PremiumCard title="Seguridad" icon={LockKeyhole}>
        <button
          type="button"
          className="security-row"
          onClick={() => setPasswordOpen(true)}
        >
          Cambiar contraseña
        </button>
      </PremiumCard>

      <PremiumCard title="Instalar aplicación" eyebrow="PWA" icon={MonitorDown}>
        <div style={{ display: "grid", gap: 12 }}>
          <p
            style={{
              color: "var(--muted-foreground)",
              margin: 0,
              fontSize: "0.875rem",
              lineHeight: 1.6,
            }}
          >
            Instalá la intranet como acceso directo en escritorio o celular.
          </p>
          <InstallAppButton />
        </div>
      </PremiumCard>

      {editing && (
        <ModalBackdrop role="dialog" aria-modal="true">
          <div className="profile-modal" style={{ width: "min(920px, 100%)" }}>
            <div className="modal-head">
              <div>
                <p className="page-kicker">Edicion completa</p>
                <h3>Editar Perfil</h3>
              </div>
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={() => setEditing(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="page-kicker" style={{ marginBottom: 10 }}>
              Informacion personal
            </p>
            <div className="grid-2" style={{ marginBottom: 18 }}>
              <EditInput
                label="Nombre completo"
                value={draft.nombreCompleto}
                onChange={setDraftValue("nombreCompleto")}
                error={errors.nombreCompleto}
              />
              <EditInput
                label="Fecha de nacimiento"
                type="date"
                value={draft.fechaNac}
                onChange={setDraftValue("fechaNac")}
                error={errors.fechaNac}
              />
              <label className="form-field">
                <span className="form-label">Estado civil</span>
                <select
                  className="form-input"
                  value={draft.estadoCivil}
                  onChange={(e) => setDraftValue("estadoCivil")(e.target.value)}
                >
                  {ESTADOS_CIVILES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <EditInput
                label="Hijos"
                type="number"
                min="0"
                value={draft.hijos}
                onChange={setDraftValue("hijos")}
              />
            </div>

            <p className="page-kicker" style={{ marginBottom: 10 }}>
              Contacto
            </p>
            <div className="grid-2" style={{ marginBottom: 18 }}>
              <EditInput
                label="Email corporativo (Gmail)"
                type="email"
                value={draft.emailEmpresa}
                onChange={setDraftValue("emailEmpresa")}
                error={errors.emailEmpresa}
              />
              <EditInput
                label="Email personal"
                type="email"
                value={draft.emailPersonal}
                onChange={setDraftValue("emailPersonal")}
                error={errors.emailPersonal}
              />
              <EditInput
                label="Telefono"
                value={draft.tel}
                onChange={setDraftValue("tel")}
                error={errors.tel}
              />
              <EditInput
                label="Celular personal"
                value={draft.celPersonal}
                onChange={setDraftValue("celPersonal")}
                error={errors.celPersonal}
              />
            </div>

            <p className="page-kicker" style={{ marginBottom: 10 }}>
              Documentacion
            </p>
            <div className="grid-2" style={{ marginBottom: 18 }}>
              <EditInput
                label="DNI"
                value={draft.documento}
                onChange={setDraftValue("documento")}
                error={errors.documento}
              />
              <EditInput
                label="CUIL"
                value={draft.cuil}
                onChange={setDraftValue("cuil")}
                error={errors.cuil}
              />
              <EditInput
                label="Domicilio"
                value={draft.domicilio}
                onChange={setDraftValue("domicilio")}
                error={errors.domicilio}
              />
            </div>

            <p className="page-kicker" style={{ marginBottom: 10 }}>
              Informacion laboral
            </p>
            <div className="grid-2" style={{ marginBottom: 18 }}>
              <label className="form-field">
                <span className="form-label">Sector</span>
                <select
                  className="form-input"
                  value={draft.sector}
                  onChange={(e) => setDraftValue("sector")(e.target.value)}
                  disabled={loadingSectores}
                >
                  <option value="">
                    {loadingSectores
                      ? "Cargando sectores..."
                      : "Seleccionar..."}
                  </option>
                  {sectorOptions.map((sector) => (
                    <option key={sector.id} value={sector.nombre}>
                      {sector.nombre}
                      {sector.activo === false
                        ? " (sector ya no disponible)"
                        : ""}
                    </option>
                  ))}
                </select>
                {sectoresError && (
                  <small className="form-feedback">{sectoresError}</small>
                )}
              </label>
              <label className="form-field">
                <span className="form-label">Sucursal</span>
                <select
                  className="form-input"
                  value={draft.sucursal}
                  onChange={(e) => setDraftValue("sucursal")(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {SUCURSALES.map((sucursal) => (
                    <option key={sucursal} value={sucursal}>
                      {sucursal}
                    </option>
                  ))}
                </select>
              </label>
              <EditInput
                label="Legajo"
                value={draft.legajo}
                onChange={setDraftValue("legajo")}
              />
              <EditInput
                label="Fecha de ingreso"
                type="date"
                value={draft.fechaIngreso || ""}
                onChange={setDraftValue("fechaIngreso")}
                error={errors.fechaIngreso}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-md btn-ghost"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-md btn-primary-fill"
                disabled={saving || Object.keys(errors).length > 0}
                onClick={save}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      <ConfirmDialog
        open={confirmPhotoRemove}
        title="¿Eliminar foto de perfil?"
        description="Se quitará tu foto actual del perfil."
        confirmLabel="Eliminar foto"
        loading={saving}
        onCancel={() => setConfirmPhotoRemove(false)}
        onConfirm={handlePhotoRemove}
      />

      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </motion.div>
  );
}
