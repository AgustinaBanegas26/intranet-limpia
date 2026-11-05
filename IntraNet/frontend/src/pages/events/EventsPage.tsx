import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  PlusCircle,
  Trash2,
  Users,
} from "lucide-react";
import { PageHero, PremiumCard } from "../../components/ui/ProductUI";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EventDetailModal } from "../../components/events/EventDetailModal";
import { EventEditModal } from "../../components/events/EventEditModal";
import { useAuth } from "../../context/AuthContext";
import { SUCURSALES } from "../../data/profileData";
import { eventsService, type EventoDTO } from "../../services/events";
import { readPdfAsDataUrl, resizeImageForSlider } from "../../utils/fileUpload";

// Prepara el valor para su uso.
function formatDate(dateStr: string) {
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Prepara el valor para su uso.
function formatTime(dateStr: string) {
  if (!dateStr.includes("T")) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// Gestiona la operacion fmtShort.
function fmtShort(dateStr: string) {
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Gestiona la operacion DateBadge.
function DateBadge({ date }: { date: string }) {
  const d = new Date(date.includes("T") ? date : `${date}T00:00:00`);
  const day = d.getDate();
  const month = d.toLocaleDateString("es-AR", { month: "short" }).toUpperCase();
  return (
    <div className="event-date-badge">
      <p>{day}</p>
      <p>{month}</p>
    </div>
  );
}

// Gestiona la operacion EventsPage.
export function EventsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<EventoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [rsvpId, setRsvpId] = useState<number | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventoDTO | null>(null);
  const [editEvent, setEditEvent] = useState<EventoDTO | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    lugar: "",
    imagen_url: "",
    pdf_url: "",
    sedeMdp: true,
    sedeCaba: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsService.getAll();
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

  // Gestiona la accion correspondiente.
  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    setUploadError("");
    try {
      const dataUrl = await resizeImageForSlider(file);
      setForm((p) => ({ ...p, imagen_url: dataUrl }));
    } catch {
      setUploadError("No se pudo cargar la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handlePdfUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingPdf(true);
    setUploadError("");
    try {
      const dataUrl = await readPdfAsDataUrl(file);
      setForm((p) => ({ ...p, pdf_url: dataUrl }));
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setUploadError(
        code === "file_too_large"
          ? "El PDF supera el tamaño máximo (8 MB)."
          : "No se pudo cargar el PDF.",
      );
    } finally {
      setUploadingPdf(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handleCreate = async () => {
    if (!form.titulo.trim() || !form.fecha_inicio) return;
    const sucursalesDestino: string[] = [];
    if (form.sedeMdp) sucursalesDestino.push(SUCURSALES[1]);
    if (form.sedeCaba) sucursalesDestino.push(SUCURSALES[0]);
    if (sucursalesDestino.length === 0) return;
    setSubmitting(true);
    setSuccessMsg("");
    try {
      await eventsService.create({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || undefined,
        lugar: form.lugar.trim() || undefined,
        imagen_url: form.imagen_url || undefined,
        pdf_url: form.pdf_url || undefined,
        sucursales_destino: sucursalesDestino,
      });
      setForm({
        titulo: "",
        descripcion: "",
        fecha_inicio: "",
        fecha_fin: "",
        lugar: "",
        imagen_url: "",
        pdf_url: "",
        sedeMdp: true,
        sedeCaba: true,
      });
      setShowForm(false);
      setSuccessMsg("Evento publicado correctamente.");
      await load();
    } catch {
      setUploadError("No se pudo crear el evento.");
    } finally {
      setSubmitting(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number) => {
    setSubmitting(true);
    setUploadError("");
    try {
      await eventsService.remove(id);
      setItems((prev) => prev.filter((e) => e.id !== id));
      setDeleteId(null);
      setSuccessMsg("Evento eliminado correctamente.");
    } catch {
      setUploadError("No se pudo eliminar el evento.");
    } finally {
      setSubmitting(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handleRsvp = async (id: number) => {
    setRsvpId(id);
    try {
      const res = await eventsService.rsvp(id);
      const { confirmado, asistentes } = res.data;
      setItems((prev) =>
        prev.map((e) => (e.id === id ? { ...e, confirmado, asistentes } : e)),
      );
    } catch {
      setUploadError("No se pudo confirmar la asistencia.");
    } finally {
      setRsvpId(null);
    }
  };

  // Gestiona la accion correspondiente.
  const handleEventSaved = (updated: EventoDTO) => {
    setItems((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
    );
    setSuccessMsg("Evento actualizado correctamente.");
  };

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Agenda"
        title="Eventos"
        description="Actividades, capacitaciones y eventos del equipo."
      />

      {successMsg && (
        <div className="auth-success" style={{ marginBottom: 12 }}>
          {successMsg}
        </div>
      )}
      {uploadError && (
        <div className="auth-error" style={{ marginBottom: 12 }}>
          {uploadError}
        </div>
      )}

      {isAdmin && (
        <PremiumCard title="Nuevo evento" icon={PlusCircle}>
          <button
            type="button"
            className={`btn btn-md ${showForm ? "btn-ghost" : "btn-primary-fill"}`}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancelar" : "Crear evento"}
          </button>
          {showForm && (
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
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
              <div className="form-field">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descripcion: e.target.value }))
                  }
                />
              </div>
              <div className="grid-2">
                <div className="form-field">
                  <label className="form-label">Inicio</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.fecha_inicio}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fecha_inicio: e.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Fin (opcional)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.fecha_fin}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fecha_fin: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Lugar</label>
                <input
                  className="form-input"
                  value={form.lugar}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, lugar: e.target.value }))
                  }
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Imagen del evento (opcional)
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <label className="btn btn-md btn-muted file-upload-btn">
                    {uploadingImage ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <ImagePlus size={15} />
                    )}
                    {uploadingImage ? "Cargando…" : "Subir imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploadingImage}
                      onChange={(e) =>
                        handleImageUpload(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  {form.imagen_url && (
                    <img
                      src={form.imagen_url}
                      alt="Vista previa"
                      className="event-form-thumb"
                    />
                  )}
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Archivo PDF (opcional)</label>
                <label className="btn btn-md btn-muted file-upload-btn">
                  {uploadingPdf ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <FileText size={15} />
                  )}
                  {uploadingPdf
                    ? "Cargando…"
                    : form.pdf_url
                      ? "PDF cargado"
                      : "Adjuntar PDF"}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    disabled={uploadingPdf}
                    onChange={(e) =>
                      handlePdfUpload(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>
              <div className="form-field">
                <label className="form-label">Destinatarios por sede</label>
                <div className="chip-select-grid">
                  {[SUCURSALES[1], `${SUCURSALES[0]} (CABA)`].map(
                    (label, i) => {
                      const key = i === 0 ? "sedeMdp" : "sedeCaba";
                      const checked = form[key as "sedeMdp" | "sedeCaba"];
                      return (
                        <label
                          key={label}
                          className={`chip-select-item${checked ? " chip-select-item--active" : ""}`}
                          style={{ cursor: "pointer" }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                [key]: e.target.checked,
                              }))
                            }
                            style={{ display: "none" }}
                          />
                          {label}
                        </label>
                      );
                    },
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-md btn-primary-fill"
                disabled={
                  submitting ||
                  uploadingImage ||
                  uploadingPdf ||
                  (!form.sedeMdp && !form.sedeCaba)
                }
                onClick={handleCreate}
              >
                {submitting ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  "Publicar evento"
                )}
              </button>
            </div>
          )}
        </PremiumCard>
      )}

      <PremiumCard
        title={isAdmin ? "Gestión de eventos" : "Próximos eventos"}
        icon={CalendarDays}
      >
        {loading ? (
          <p style={{ color: "var(--muted-foreground)" }}>Cargando eventos…</p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--muted-foreground)" }}>
            No hay eventos programados.
          </p>
        ) : isAdmin ? (
          <div className="admin-list">
            {items.map((event) => (
              <div key={event.id} className="admin-list-row">
                <div className="admin-list-row__thumb">
                  {event.imagen_url ? (
                    <img src={event.imagen_url} alt="" />
                  ) : (
                    <CalendarDays size={18} />
                  )}
                </div>
                <div className="admin-list-row__body">
                  <strong>{event.titulo}</strong>
                  <span>
                    {fmtShort(event.fecha_inicio)}
                    {event.lugar ? ` · ${event.lugar}` : ""}
                  </span>
                  <em>
                    {event.asistentes ?? 0} confirmados ·{" "}
                    {event.activo === false ? "Inactivo" : "Activo"}
                  </em>
                </div>
                <div className="admin-list-row__actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setDetailEvent(event)}
                  >
                    <Eye size={14} />
                    Ver
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setEditEvent(event)}
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    style={{ color: "var(--danger)" }}
                    onClick={() => setDeleteId(event.id)}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="events-employee-list"
            initial="hidden"
            animate="visible"
          >
            {items.map((event, i) => {
              const time = formatTime(event.fecha_inicio);
              const hasDetails = Boolean(
                event.descripcion || event.imagen_url || event.pdf_url,
              );
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="card event-employee-card"
                >
                  <div className="event-employee-card__main">
                    {event.imagen_url && (
                      <div className="event-card-image-wrap event-card-image-wrap--compact">
                        <img
                          src={event.imagen_url}
                          alt={event.titulo}
                          className="event-card-image"
                        />
                      </div>
                    )}
                    <div className="event-employee-card__content">
                      <div
                        style={{
                          display: "flex",
                          gap: 14,
                          alignItems: "flex-start",
                        }}
                      >
                        <DateBadge date={event.fecha_inicio} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 className="event-employee-card__title">
                            {event.titulo}
                          </h3>
                          {event.descripcion && (
                            <p className="event-employee-card__desc">
                              {event.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="event-employee-card__meta">
                        <span>
                          <Clock size={13} /> {formatDate(event.fecha_inicio)}
                          {time ? ` · ${time}hs` : ""}
                        </span>
                        {event.lugar && (
                          <span>
                            <MapPin size={13} /> {event.lugar}
                          </span>
                        )}
                        <span>
                          <Users size={13} /> {event.asistentes ?? 0}{" "}
                          confirmados
                        </span>
                      </div>
                      <div className="event-employee-card__actions">
                        {hasDetails && (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => setDetailEvent(event)}
                          >
                            <Eye size={14} />
                            Ver detalle
                          </button>
                        )}
                        <button
                          type="button"
                          className={`btn btn-sm ${event.confirmado ? "btn-ghost" : "btn-primary-fill"}`}
                          disabled={rsvpId === event.id}
                          onClick={() => handleRsvp(event.id)}
                        >
                          {rsvpId === event.id ? (
                            <Loader2 size={14} className="spin" />
                          ) : event.confirmado ? (
                            <>
                              <CheckCircle size={14} />
                              Confirmado
                            </>
                          ) : (
                            <>
                              <CalendarDays size={14} />
                              Confirmar asistencia
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </PremiumCard>

      <EventDetailModal
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
      />
      <EventEditModal
        event={editEvent}
        onClose={() => setEditEvent(null)}
        onSaved={handleEventSaved}
      />

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar evento?"
        description="Se borrará permanentemente de la base de datos junto con las confirmaciones de asistencia."
        confirmLabel="Eliminar"
        loading={submitting}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId != null) await handleDelete(deleteId);
        }}
      />
    </div>
  );
}
