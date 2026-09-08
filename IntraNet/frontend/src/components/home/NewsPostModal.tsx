import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Megaphone,
  Paperclip,
  X,
} from "lucide-react";
import { getInitials } from "../../context/AuthContext";
import type { EncuestaDTO, NovedadDTO } from "../../services/news";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { formatPublishDate } from "../../utils/formatPublishDate";
import { NewsPoll } from "../news/NewsPoll";
import { ModalBackdrop } from "../ui/ModalBackdrop";

type NewsPostModalProps = {
  post: NovedadDTO;
  open: boolean;
  onClose: () => void;
  liked?: boolean;
  likeDisabled?: boolean;
  onToggleLike?: (id: string | number) => void;
  token?: string | null;
  onPollUpdate?: (id: string | number, encuesta: EncuestaDTO) => void;
};

export function NewsPostModal({
  post,
  open,
  onClose,
  liked = false,
  likeDisabled = false,
  onToggleLike,
  token = null,
  onPollUpdate,
}: NewsPostModalProps) {
  const [encuesta, setEncuesta] = useState(post.encuesta);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setEncuesta(post.encuesta);
  }, [post.encuesta]);

  useEffect(() => {
    if (!open) return;
    setImageIndex(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const authorName = post.autor?.trim() || "Administración";
  const authorMeta =
    [post.autorSector, post.autorSucursal].filter(Boolean).join(" · ") ||
    "Organización";
  const timeRelative = formatRelativeTime(post.fecha);
  const timeAbsolute = formatPublishDate(post.fecha);
  const images = post.imagenes?.filter(Boolean) ?? [];
  const canLike = Boolean(post.id && onToggleLike && !likeDisabled);
  const hasMedia = images.length > 0;

  return (
    <ModalBackdrop
      className="news-post-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`news-post-modal ${hasMedia ? "news-post-modal--with-media" : "news-post-modal--text-only"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="news-post-modal__close btn btn-icon btn-ghost"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {hasMedia && (
          <div className="news-post-modal__media">
            <img src={images[imageIndex]} alt="" />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="news-post-modal__nav news-post-modal__nav--prev"
                  onClick={() =>
                    setImageIndex(
                      (i) => (i - 1 + images.length) % images.length,
                    )
                  }
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="news-post-modal__nav news-post-modal__nav--next"
                  onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="news-post-modal__dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`news-post-modal__dot ${i === imageIndex ? "is-active" : ""}`}
                      onClick={() => setImageIndex(i)}
                      aria-label={`Imagen ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="news-post-modal__panel">
          <div className="news-post-modal__author">
            <div
              className="avatar avatar-md avatar-gradient"
              style={{ fontSize: "0.75rem", overflow: "hidden" }}
            >
              {post.autorFoto ? (
                <img
                  src={post.autorFoto}
                  alt={authorName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getInitials(authorName)
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                {authorName}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "var(--muted-foreground)",
                  marginTop: 1,
                }}
              >
                {authorMeta}
              </p>
            </div>
            {post.importante && (
              <span className="news-post-modal__badge">
                <Megaphone size={12} />
                Importante
              </span>
            )}
          </div>

          {timeAbsolute && (
            <p className="news-post-modal__date">
              Publicado · {timeAbsolute}
              {timeRelative ? ` (${timeRelative})` : ""}
            </p>
          )}

          {post.titulo && (
            <h3 className="news-post-modal__title">{post.titulo}</h3>
          )}

          <div className="news-post-modal__content">
            {post.contenido
              .split("\n")
              .map((paragraph, index) =>
                paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
              )}
          </div>

          {post.archivo?.url && (
            <a
              href={post.archivo.url}
              download={post.archivo.nombre}
              target="_blank"
              rel="noopener noreferrer"
              className="news-post-modal__attachment"
            >
              <Paperclip size={15} />
              {post.archivo.nombre}
              <Download size={14} />
            </a>
          )}

          {encuesta && post.id != null && (
            <NewsPoll
              novedadId={post.id}
              encuesta={encuesta}
              token={token}
              onVote={(next) => {
                setEncuesta(next);
                onPollUpdate?.(post.id!, next);
              }}
            />
          )}

          <div className="news-post-modal__footer">
            {canLike ? (
              <button
                type="button"
                onClick={() => post.id != null && onToggleLike?.(post.id)}
                aria-pressed={liked}
                className={`news-post-modal__like ${liked ? "is-liked" : ""}`}
              >
                <Heart
                  size={16}
                  style={{ fill: liked ? "var(--primary)" : "none" }}
                />
                Me gusta
              </button>
            ) : null}
            {post.likes != null && post.likes > 0 && (
              <span className="news-post-modal__reactions">
                {post.likes} reacciones
              </span>
            )}
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}
