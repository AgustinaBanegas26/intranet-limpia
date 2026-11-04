import { useCallback, useEffect, useState } from "react";
import {
  ImageIcon,
  ImagePlus,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { PremiumCard } from "../ui/ProductUI";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { sliderService, type SliderSlideDTO } from "../../services/slider";
import { resizeImageForSlider } from "../../utils/fileUpload";

const emptyForm = {
  titulo: "",
  subtitulo: "",
  imagen_url: "",
  enlace: "",
  orden: "0",
  activo: true,
  mostrar_titulo: false,
};

// Gestiona la operacion SliderAdminPanel.
export function SliderAdminPanel() {
  const [slides, setSlides] = useState<SliderSlideDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await sliderService.getAll();
      setSlides(res.data || []);
    } catch {
      setSlides([]);
      setError("No se pudieron cargar los slides.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Limpia el estado o los datos correspondientes.
  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  // Gestiona la accion correspondiente.
  const handleEdit = (slide: SliderSlideDTO) => {
    setEditingId(slide.id);
    setForm({
      titulo: slide.titulo,
      subtitulo: slide.subtitulo || "",
      imagen_url: slide.imagen_url,
      enlace: slide.enlace || "",
      orden: String(slide.orden ?? 0),
      activo: slide.activo !== false,
      mostrar_titulo: slide.mostrar_titulo !== false,
    });
    setShowForm(true);
  };

  // Gestiona la accion correspondiente.
  const handleGalleryImage = async (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const dataUrl = await resizeImageForSlider(file);
      setForm((prev) => ({ ...prev, imagen_url: dataUrl }));
    } catch (err) {
      const code = err instanceof Error ? err.message : "upload_failed";
      setError(
        code === "file_too_large"
          ? "La imagen es demasiado grande. Probá con otra."
          : code === "invalid_file_type" || code === "invalid_image"
            ? "El archivo debe ser una imagen válida."
            : "No se pudo cargar la imagen.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handleSave = async () => {
    if (!form.imagen_url.trim()) {
      setError("La imagen es obligatoria.");
      return;
    }
    const titulo = form.titulo.trim();
    const subtitulo = form.subtitulo.trim();
    const mostrarTitulo = form.mostrar_titulo && !!titulo;

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        titulo: titulo || undefined,
        subtitulo: subtitulo || undefined,
        imagen_url: form.imagen_url.trim(),
        enlace: form.enlace.trim() || undefined,
        orden: Number(form.orden) || 0,
        activo: form.activo,
        mostrar_titulo: mostrarTitulo,
      };

      if (editingId) {
        await sliderService.update(editingId, payload);
      } else {
        await sliderService.create(payload);
      }
      resetForm();
      await load();
      window.dispatchEvent(new CustomEvent("portal:home-slider-changed"));
    } catch {
      setError("No se pudo guardar el slide.");
    } finally {
      setSubmitting(false);
    }
  };

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: string) => {
    setSubmitting(true);
    setError("");
    try {
      await sliderService.remove(id);
      if (editingId === id) resetForm();
      await load();
      setDeleteId(null);
      window.dispatchEvent(new CustomEvent("portal:home-slider-changed"));
    } catch {
      setError("No se pudo eliminar el slide.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PremiumCard
      title="Slider principal"
      eyebrow="Inicio del empleado"
      icon={ImageIcon}
    >
      <p
        style={{
          margin: "0 0 14px",
          fontSize: "0.8125rem",
          color: "var(--muted-foreground)",
          lineHeight: 1.55,
        }}
      >
        Gestioná las imágenes del carrusel del inicio. Los slides marcados como{" "}
        <strong>Visibles</strong> los ven todos los empleados en su pantalla de
        inicio. Preferí subir la imagen desde galería o usar una URL directa al
        archivo (.jpg, .png, .webp).
      </p>

      {error && (
        <p
          style={{
            color: "var(--danger)",
            fontSize: "0.8125rem",
            margin: "0 0 12px",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        className={`btn btn-md ${showForm ? "btn-ghost" : "btn-primary-fill"}`}
        onClick={() => (showForm ? resetForm() : setShowForm(true))}
      >
        <PlusCircle size={16} />
        {showForm ? "Cancelar" : "Agregar slide"}
      </button>

      {showForm && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <label className="form-field slider-checkbox-field">
            <input
              type="checkbox"
              checked={form.mostrar_titulo}
              onChange={(e) =>
                setForm((p) => ({ ...p, mostrar_titulo: e.target.checked }))
              }
            />
            <span className="form-label">Mostrar título sobre la imagen</span>
          </label>
          <p
            style={{
              margin: "-4px 0 0",
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
              lineHeight: 1.45,
            }}
          >
            Desactivá esta opción para mostrar solo la imagen, sin texto ni
            difuminado.
          </p>

          {form.mostrar_titulo && (
            <>
              <label className="form-field">
                <span className="form-label">Título</span>
                <input
                  className="form-input"
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, titulo: e.target.value }))
                  }
                />
              </label>
              <label className="form-field">
                <span className="form-label">Subtítulo (opcional)</span>
                <input
                  className="form-input"
                  value={form.subtitulo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subtitulo: e.target.value }))
                  }
                />
              </label>
            </>
          )}

          <div className="form-field">
            <span className="form-label">Imagen del slide</span>
            <div className="slider-image-actions">
              <label className="btn btn-sm btn-ghost slider-gallery-btn">
                {uploadingImage ? (
                  <Loader2 size={15} className="spin" />
                ) : (
                  <ImagePlus size={15} />
                )}
                Elegir desde galería
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingImage || submitting}
                  onChange={(e) => {
                    void handleGalleryImage(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <input
              className="form-input"
              value={form.imagen_url.startsWith("data:") ? "" : form.imagen_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, imagen_url: e.target.value }))
              }
              placeholder="O pegá una URL: /logo.png o https://..."
              style={{ marginTop: 8 }}
            />
            {form.imagen_url && (
              <div className="slider-image-preview">
                <img src={form.imagen_url} alt="Vista previa del slide" />
                <button
                  type="button"
                  className="slider-image-preview__remove"
                  aria-label="Quitar imagen"
                  onClick={() => setForm((p) => ({ ...p, imagen_url: "" }))}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <label className="form-field">
            <span className="form-label">Enlace (opcional)</span>
            <input
              className="form-input"
              value={form.enlace}
              onChange={(e) =>
                setForm((p) => ({ ...p, enlace: e.target.value }))
              }
              placeholder="/novedades o https://..."
            />
          </label>
          <label className="form-field">
            <span className="form-label">Orden</span>
            <input
              className="form-input"
              type="number"
              value={form.orden}
              onChange={(e) =>
                setForm((p) => ({ ...p, orden: e.target.value }))
              }
            />
          </label>
          <label className="form-field slider-checkbox-field">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) =>
                setForm((p) => ({ ...p, activo: e.target.checked }))
              }
            />
            <span className="form-label">Visible en el inicio</span>
          </label>
          <button
            type="button"
            className="btn btn-md btn-primary-fill"
            disabled={submitting || uploadingImage}
            onClick={handleSave}
          >
            {submitting ? (
              <Loader2 size={16} className="spin" />
            ) : editingId ? (
              "Guardar cambios"
            ) : (
              "Publicar slide"
            )}
          </button>
        </div>
      )}

      <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
        {loading ? (
          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: "0.875rem",
              margin: 0,
            }}
          >
            Cargando slides…
          </p>
        ) : slides.length === 0 ? (
          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: "0.875rem",
              margin: 0,
            }}
          >
            No hay slides configurados.
          </p>
        ) : (
          slides.map((slide) => (
            <div key={slide.id} className="slider-admin-row">
              <div className="slider-admin-row__thumb">
                <img src={slide.imagen_url} alt="" />
              </div>
              <div className="slider-admin-row__body">
                <strong>
                  {slide.titulo?.trim() ? slide.titulo : "Solo imagen"}
                </strong>
                {slide.titulo?.trim() && slide.subtitulo && (
                  <span>{slide.subtitulo}</span>
                )}
                <em>
                  {slide.activo === false ? "Oculto" : "Visible"} · Orden{" "}
                  {slide.orden ?? 0}
                  {!slide.titulo?.trim() ? " · Sin título" : ""}
                </em>
              </div>
              <div className="slider-admin-row__actions">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleEdit(slide)}
                  disabled={submitting}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setDeleteId(slide.id)}
                  disabled={submitting}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar slide?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={submitting}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId != null) await handleDelete(deleteId);
        }}
      />
    </PremiumCard>
  );
}
