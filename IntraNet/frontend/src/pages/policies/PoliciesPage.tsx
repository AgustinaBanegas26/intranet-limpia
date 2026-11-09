// Pantalla del frontend: combina componentes React, estado y servicios para presentar este módulo al usuario. Tema específico: políticas internas.
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Download,
  ExternalLink,
  Lock,
  Users,
  FileText,
  Clock,
  CheckCircle,
  PlusCircle,
  Loader2,
  Upload,
  Pencil,
} from "lucide-react";
import { PageHero, PremiumCard } from "../../components/ui/ProductUI";
import { AdminDeleteButton } from "../../components/ui/AdminDeleteButton";
import { AlertDialog } from "../../components/ui/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { policiesService, type PoliticaDTO } from "../../services/policies";
import { readPdfAsDataUrl } from "../../utils/fileUpload";
const CAT_ICONS: Record<string, typeof ShieldCheck> = {
  rrhh: Users,
  conducta: ShieldCheck,
  seguridad: Lock,
  tecnologia: FileText,
  finanzas: FileText,
};

const COLORS = [
  "#6366F1",
  "#E53935",
  "#F59E0B",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
];

// Gestiona la operacion fmtDate.
function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d.includes("T") ? d : `${d}T00:00:00`).toLocaleDateString(
    "es-AR",
    { day: "numeric", month: "long", year: "numeric" },
  );
}

// Gestiona la operacion PoliciesPage.
export function PoliciesPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<PoliticaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    categoria: "",
    archivo_url: "",
    version: "v1.0",
    obligatoria: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await policiesService.getAll();
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((p) => {
      if (p.categoria) cats.add(p.categoria.toLowerCase());
    });
    return Array.from(cats).sort();
  }, [items]);

  const filtered =
    activeCategory === "todos"
      ? items
      : items.filter(
          (p) => (p.categoria || "").toLowerCase() === activeCategory,
        );

  // Limpia el estado o los datos correspondientes.
  const resetForm = () => {
    setForm({
      titulo: "",
      categoria: "",
      archivo_url: "",
      version: "v1.0",
      obligatoria: false,
    });
    setEditingId(null);
    setPdfName("");
    setShowForm(false);
  };

  // Gestiona la accion correspondiente.
  const handlePdfUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readPdfAsDataUrl(file);
      setForm((prev) => ({ ...prev, archivo_url: dataUrl }));
      setPdfName(file.name);
    } catch {
      setPdfError(
        "No se pudo cargar el PDF. Verificá que sea un archivo PDF de hasta 8 MB.",
      );
    }
    event.target.value = "";
  };

  // Gestiona la accion correspondiente.
  const handleCreate = async () => {
    if (!form.titulo.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        categoria: form.categoria.trim() || undefined,
        archivo_url: form.archivo_url.trim() || undefined,
        version: form.version.trim() || undefined,
        obligatoria: form.obligatoria,
      };
      if (editingId) {
        await policiesService.update(editingId, payload);
      } else {
        await policiesService.create(payload);
      }
      resetForm();
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handleEdit = (policy: PoliticaDTO) => {
    setEditingId(policy.id);
    setForm({
      titulo: policy.titulo,
      categoria: policy.categoria || "",
      archivo_url: policy.archivo_url || "",
      version: policy.version || "v1.0",
      obligatoria: Boolean(policy.obligatoria),
    });
    setPdfName(policy.archivo_url ? "PDF cargado" : "");
    setShowForm(true);
  };
  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number) => {
    await policiesService.remove(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  // Gestiona la accion correspondiente.
  const handleMarkRead = async (id: number) => {
    setMarkingId(id);
    try {
      await policiesService.markRead(id);
      await load();
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Cumplimiento"
        title="Políticas"
        description="Documentos normativos y políticas internas vigentes."
      />

      {isAdmin && (
        <PremiumCard
          title={editingId ? "Editar política" : "Nueva política"}
          icon={PlusCircle}
        >
          <button
            type="button"
            className={`btn btn-md ${showForm ? "btn-ghost" : "btn-primary-fill"}`}
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            {showForm ? "Cancelar" : "Agregar política"}
          </button>
          {showForm && (
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {" "}
              <div className="form-field">
                <label className="form-label">Título</label>
                <input
                  className="form-input"
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, titulo: e.target.value }))
                  }
                />
              </div>
              <div className="grid-2">
                <div className="form-field">
                  <label className="form-label">Categoría</label>
                  <input
                    className="form-input"
                    value={form.categoria}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, categoria: e.target.value }))
                    }
                    placeholder="rrhh, conducta…"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Versión</label>
                  <input
                    className="form-input"
                    value={form.version}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, version: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Archivo PDF</label>
                <label className="btn btn-md btn-muted file-upload-btn">
                  <Upload size={15} />
                  {pdfName || "Subir PDF"}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfUpload}
                    hidden
                  />
                </label>
                {form.archivo_url && !form.archivo_url.startsWith("http") && (
                  <small
                    className="form-feedback"
                    style={{ color: "var(--success)" }}
                  >
                    PDF listo para guardar
                  </small>
                )}
              </div>
              <div className="form-field">
                <label className="form-label">URL del archivo (opcional)</label>
                <input
                  className="form-input"
                  value={
                    form.archivo_url.startsWith("data:") ? "" : form.archivo_url
                  }
                  onChange={(e) =>
                    setForm((p) => ({ ...p, archivo_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>{" "}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.875rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.obligatoria}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, obligatoria: e.target.checked }))
                  }
                />
                Lectura obligatoria
              </label>
              <button
                type="button"
                className="btn btn-md btn-primary-fill"
                disabled={submitting}
                onClick={handleCreate}
              >
                {submitting ? (
                  <Loader2 size={16} className="spin" />
                ) : editingId ? (
                  "Guardar cambios"
                ) : (
                  "Publicar"
                )}
              </button>{" "}
            </div>
          )}
        </PremiumCard>
      )}

      {categories.length > 0 && (
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${activeCategory === "todos" ? "active" : ""}`}
            onClick={() => setActiveCategory("todos")}
          >
            <FileText size={13} />
            Todas
          </button>
          {categories.map((cat) => {
            const Icon = CAT_ICONS[cat] || FileText;
            return (
              <button
                key={cat}
                type="button"
                className={`chip ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                <Icon size={13} />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--muted-foreground)" }}>Cargando políticas…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--muted-foreground)" }}>
          No hay políticas publicadas.
        </p>
      ) : (
        <motion.div
          style={{ display: "grid", gap: 12 }}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((policy, i) => {
            const cat = (policy.categoria || "general").toLowerCase();
            const color = COLORS[i % COLORS.length];
            const Icon = CAT_ICONS[cat] || FileText;
            return (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.28 }}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  position: "relative",
                }}
              >
                {isAdmin && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-icon btn-ghost"
                      title="Editar política"
                      onClick={() => handleEdit(policy)}
                    >
                      <Pencil size={16} />
                    </button>
                    <AdminDeleteButton
                      label="Eliminar política"
                      onConfirm={() => handleDelete(policy.id)}
                    />
                  </div>
                )}{" "}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: `${color}15`,
                    color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "0.9375rem",
                        fontWeight: 800,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {policy.titulo}
                    </h3>
                    {policy.version && (
                      <span
                        style={{
                          background: `${color}15`,
                          color,
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {policy.version}
                      </span>
                    )}
                    {policy.obligatoria && (
                      <span
                        style={{
                          background: "var(--warning-bg)",
                          color: "var(--warning)",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                        }}
                      >
                        Obligatoria
                      </span>
                    )}
                    {policy.leida && (
                      <span
                        style={{
                          background: "var(--success-bg)",
                          color: "var(--success)",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircle size={11} />
                        Leída
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginTop: 8,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.72rem",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      <Clock size={11} />
                      Actualizado{" "}
                      {fmtDate(policy.updated_at || policy.created_at)}
                    </span>
                    {policy.archivo_url && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <a
                          href={policy.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-ghost"
                          style={{ borderRadius: 10, minHeight: 32 }}
                        >
                          <Download size={12} />
                          Descargar
                        </a>
                        <a
                          href={policy.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-muted"
                          style={{ borderRadius: 10, minHeight: 32 }}
                        >
                          <ExternalLink size={12} />
                          Ver
                        </a>
                      </div>
                    )}
                    {!isAdmin && !policy.leida && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary-fill"
                        disabled={markingId === policy.id}
                        onClick={() => handleMarkRead(policy.id)}
                      >
                        {markingId === policy.id ? (
                          <Loader2 size={12} className="spin" />
                        ) : (
                          "Marcar como leída"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
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
  );
}
