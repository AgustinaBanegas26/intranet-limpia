import { useEffect, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { SUCURSALES } from "../../data/profileData";
import { newsService, type NovedadDTO } from "../../services/news";
import { ModalBackdrop } from "../ui/ModalBackdrop";
import { authErrorMessage } from "../../utils/sessionToken";

const MAX_IMAGE_MB = 4;

type FormState = {
  titulo: string;
  contenido: string;
  importante: boolean;
  sedeMdp: boolean;
  sedeCaba: boolean;
  imagenUrl: string | null;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function formFromPost(post: NovedadDTO): FormState {
  const destinos = post.sucursalesDestino || [];
  return {
    titulo: post.titulo,
    contenido: post.contenido,
    importante: Boolean(post.importante),
    sedeMdp: destinos.length === 0 || destinos.includes(SUCURSALES[1]),
    sedeCaba: destinos.length === 0 || destinos.includes(SUCURSALES[0]),
    imagenUrl: post.imagenes?.[0] ?? null,
  };
}

type Props = {
  post: NovedadDTO | null;
  token: string | null;
  onClose: () => void;
  onSaved: (post: NovedadDTO) => void;
};

export function NewsEditModal({ post, token, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>({
    titulo: "",
    contenido: "",
    importante: false,
    sedeMdp: true,
    sedeCaba: true,
    imagenUrl: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!post) return;
    setForm(formFromPost(post));
    setError("");
  }, [post]);

  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [post, onClose]);

  if (!post || post.id == null) return null;

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("La imagen debe ser JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`La imagen no puede superar ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setUploadingImage(true);
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((p) => ({ ...p, imagenUrl: dataUrl }));
    } catch {
      setError("No se pudo cargar la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const tituloTrim = form.titulo.trim();
    const contenidoTrim = form.contenido.trim();
    if (!tituloTrim || !contenidoTrim) {
      setError("Completá título y mensaje.");
      return;
    }

    const sucursalesDestino: string[] = [];
    if (form.sedeMdp) sucursalesDestino.push(SUCURSALES[1]);
    if (form.sedeCaba) sucursalesDestino.push(SUCURSALES[0]);
    if (sucursalesDestino.length === 0) {
      setError("Seleccioná al menos una sede destino.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await newsService.update(
        post.id!,
        {
          titulo: tituloTrim,
          contenido: contenidoTrim,
          importante: form.importante,
          imagen_url: form.imagenUrl,
          sucursales_destino: sucursalesDestino,
        },
        token,
      );
      onSaved(updated);
      onClose();
      window.dispatchEvent(new CustomEvent("portal:novedades-changed"));
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : "request_failed";
      setError(authErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBackdrop role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="profile-modal"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="page-kicker">Editar publicación</p>
            <h3>{post.titulo}</h3>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
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
            <label className="form-label">Mensaje</label>
            <textarea
              className="form-input"
              rows={5}
              value={form.contenido}
              onChange={(e) =>
                setForm((p) => ({ ...p, contenido: e.target.value }))
              }
            />
          </div>

          <label
            className="form-check"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <input
              type="checkbox"
              checked={form.importante}
              onChange={(e) =>
                setForm((p) => ({ ...p, importante: e.target.checked }))
              }
            />
            Marcar como comunicación importante
          </label>

          <div className="form-field">
            <span className="form-label">Sedes destino</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <label
                className="form-check"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <input
                  type="checkbox"
                  checked={form.sedeMdp}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sedeMdp: e.target.checked }))
                  }
                />
                {SUCURSALES[1]}
              </label>
              <label
                className="form-check"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <input
                  type="checkbox"
                  checked={form.sedeCaba}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sedeCaba: e.target.checked }))
                  }
                />
                {SUCURSALES[0]}
              </label>
            </div>
          </div>

          <div className="form-field">
            <span className="form-label">Imagen</span>
            {form.imagenUrl ? (
              <div style={{ display: "grid", gap: 8 }}>
                <img
                  src={form.imagenUrl}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setForm((p) => ({ ...p, imagenUrl: null }))}
                >
                  Quitar imagen
                </button>
              </div>
            ) : (
              <label
                className="btn btn-sm btn-ghost"
                style={{ cursor: "pointer", width: "fit-content" }}
              >
                {uploadingImage ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <ImagePlus size={14} />
                )}
                {uploadingImage ? "Cargando…" : "Agregar imagen"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingImage}
                  onChange={(e) =>
                    void handleImageUpload(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            )}
          </div>

          {post.encuesta && (
            <p
              style={{
                margin: 0,
                fontSize: "0.8125rem",
                color: "var(--muted-foreground)",
              }}
            >
              La encuesta no se puede modificar desde aquí.
            </p>
          )}

          {error && (
            <p
              style={{
                color: "var(--danger)",
                fontSize: "0.8125rem",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-md btn-ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-md btn-primary-fill"
            onClick={() => void handleSave()}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 size={16} className="spin" />
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
