import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Send,
  ArrowLeft,
  Trash2,
  User,
  Clock,
  PenSquare,
  Loader2,
} from "lucide-react";
import { getInitials } from "../../context/AuthContext";
import { PageHero } from "../../components/ui/ProductUI";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import {
  messagesService,
  type ContactoDTO,
  type MensajeDTO,
} from "../../services/messages";

// Gestiona la operacion timeLabel.
function timeLabel(d: string) {
  const date = new Date(d.includes("T") ? d : `${d}T12:00:00`);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// Gestiona la operacion InboxPage.
export function InboxPage() {
  const [messages, setMessages] = useState<MensajeDTO[]>([]);
  const [contactos, setContactos] = useState<ContactoDTO[]>([]);
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [selected, setSelected] = useState<MensajeDTO | null>(null);
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    destinatario_id: "",
    subject: "",
    body: "",
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [inboxRes, sentRes, contactosRes] = await Promise.all([
        messagesService.getAll("inbox"),
        messagesService.getAll("sent"),
        messagesService.getContactos(),
      ]);
      setMessages([...(inboxRes.data || []), ...(sentRes.data || [])]);
      setContactos(contactosRes.data || []);
    } catch (err) {
      console.error("Error al cargar el buzón:", err);
      setMessages([]);
      setContactos([]);
      setError("No fue posible cargar el buzón. Intentá de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const folderMessages = messages.filter((m) => m.folder === folder);
  const unreadCount = messages.filter(
    (m) => m.folder === "inbox" && !m.read,
  ).length;

  // Gestiona la accion correspondiente.
  const handleSelect = async (msg: MensajeDTO) => {
    setSelected(msg);
    setComposing(false);
    if (!msg.read && msg.folder === "inbox") {
      try {
        await messagesService.markRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)),
        );
      } catch {
        // ignore
      }
    }
  };

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await messagesService.remove(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      setDeleteId(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handleSend = async () => {
    if (!draft.destinatario_id || !draft.body.trim()) return;
    setSending(true);
    try {
      const res = await messagesService.create({
        destinatario_id: Number(draft.destinatario_id),
        asunto: draft.subject,
        cuerpo: draft.body,
      });
      setMessages((prev) => [res.data, ...prev]);
      setDraft({ destinatario_id: "", subject: "", body: "" });
      setComposing(false);
      setFolder("sent");
    } catch {
      setError("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Comunicaciones"
        title="Buzón"
        description="Mensajes internos entre empleados."
      />

      {error && (
        <p
          style={{
            color: "var(--danger)",
            fontSize: "0.875rem",
            marginBottom: 12,
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: selected || composing ? "280px 1fr" : "1fr",
        }}
      >
        <div
          style={{ display: selected || composing ? "block" : "grid", gap: 0 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div className="segmented">
              <button
                type="button"
                className={folder === "inbox" ? "active" : ""}
                onClick={() => {
                  setFolder("inbox");
                  setSelected(null);
                }}
              >
                <Inbox size={14} />
                Recibidos
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: "var(--primary)",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "1px 6px",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={folder === "sent" ? "active" : ""}
                onClick={() => {
                  setFolder("sent");
                  setSelected(null);
                }}
              >
                <Send size={14} />
                Enviados
              </button>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary-fill"
              style={{ borderRadius: 12 }}
              onClick={() => {
                setComposing(true);
                setSelected(null);
              }}
            >
              <PenSquare size={14} />
              Nuevo
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <p style={{ padding: 16, color: "var(--muted-foreground)" }}>
                Cargando…
              </p>
            ) : folderMessages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Inbox size={22} />
                </div>
                <p className="empty-state-title">Bandeja vacía</p>
                <p className="empty-state-desc">
                  No tenés mensajes en esta carpeta.
                </p>
              </div>
            ) : (
              folderMessages.map((msg, i) => (
                <motion.button
                  key={msg.id}
                  type="button"
                  onClick={() => handleSelect(msg)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 16px",
                    width: "100%",
                    background:
                      selected?.id === msg.id ? "var(--accent)" : "transparent",
                    border: 0,
                    borderBottom:
                      i < folderMessages.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    className="avatar avatar-sm avatar-gradient"
                    style={{
                      fontSize: "0.6rem",
                      borderRadius: 8,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {getInitials(folder === "inbox" ? msg.from : msg.to)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 4,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: msg.read ? 600 : 800,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {folder === "inbox" ? msg.from : msg.to}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--muted-foreground)",
                          flexShrink: 0,
                        }}
                      >
                        {timeLabel(msg.date)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8125rem",
                        fontWeight: msg.read ? 500 : 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {msg.subject}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "0.75rem",
                        color: "var(--muted-foreground)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {msg.body.split("\n")[0]}
                    </p>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        <AnimatePresence>
          {(selected || composing) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minHeight: 300,
              }}
            >
              {composing ? (
                <>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <button
                      type="button"
                      onClick={() => setComposing(false)}
                      className="btn btn-icon btn-ghost"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <h3 className="card-title">Nuevo mensaje</h3>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div className="form-field">
                      <label className="form-label">Para</label>
                      <select
                        className="form-input"
                        value={draft.destinatario_id}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            destinatario_id: e.target.value,
                          }))
                        }
                      >
                        <option value="">Seleccionar destinatario…</option>
                        {contactos.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                            {c.area ? ` · ${c.area}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Asunto</label>
                      <input
                        type="text"
                        className="form-input"
                        value={draft.subject}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, subject: e.target.value }))
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Mensaje</label>
                      <textarea
                        className="form-input"
                        rows={8}
                        value={draft.body}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, body: e.target.value }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-md btn-primary-fill"
                      style={{ alignSelf: "flex-start" }}
                      disabled={sending}
                      onClick={handleSend}
                    >
                      {sending ? (
                        <Loader2 size={15} className="spin" />
                      ) : (
                        <Send size={15} />
                      )}
                      Enviar mensaje
                    </button>
                  </div>
                </>
              ) : selected ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(null)}
                        className="btn btn-icon btn-ghost"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <h3 className="card-title" style={{ margin: 0 }}>
                        {selected.subject}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteId(selected.id)}
                      className="btn btn-icon btn-ghost"
                      aria-label="Eliminar"
                      style={{ color: "var(--danger)" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      className="avatar avatar-md avatar-gradient"
                      style={{ fontSize: "0.75rem", borderRadius: 12 }}
                    >
                      {getInitials(selected.from)}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: "0.875rem",
                        }}
                      >
                        {selected.from}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <User
                          size={11}
                          style={{ color: "var(--muted-foreground)" }}
                        />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          Para: {selected.to}
                        </span>
                        <Clock
                          size={11}
                          style={{ color: "var(--muted-foreground)" }}
                        />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {timeLabel(selected.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      paddingTop: 16,
                    }}
                  >
                    {selected.body.split("\n").map((line, i) =>
                      line.trim() ? (
                        <p
                          key={i}
                          style={{
                            margin: "0 0 8px",
                            fontSize: "0.9rem",
                            lineHeight: 1.65,
                          }}
                        >
                          {line}
                        </p>
                      ) : (
                        <br key={i} />
                      ),
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar mensaje?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId != null) await handleDelete(deleteId);
        }}
      />
    </div>
  );
}
