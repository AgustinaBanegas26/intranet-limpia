import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BarChart3, Heart, Megaphone, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { getInitials } from '../../context/AuthContext'
import type { EncuestaDTO, NovedadDTO } from '../../services/news'
import { newsService } from '../../services/news'
import { formatRelativeTime } from '../../utils/formatRelativeTime'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { NewsEditModal } from '../news/NewsEditModal'
import { NewsPoll } from '../news/NewsPoll'
import { NewsPostModal } from './NewsPostModal'

type NewsPostCardProps = {
  post: NovedadDTO
  liked?: boolean
  likeDisabled?: boolean
  onToggleLike?: (id: string | number) => void
  token?: string | null
  onPollUpdate?: (id: string | number, encuesta: EncuestaDTO) => void
  canManage?: boolean
  onUpdated?: (post: NovedadDTO) => void
  onDeleted?: (id: string | number) => void
}

function needsExpand(text: string) {
  const clean = text.trim()
  return clean.length > 180 || clean.split('\n').filter((l) => l.trim()).length > 3
}

function postTypeLabel(post: NovedadDTO) {
  if (post.encuesta?.pregunta) return { icon: '🗳', label: 'Encuesta interna' }
  if (post.importante) return { icon: '📢', label: 'Comunicación importante' }
  return { icon: '📢', label: 'Comunicación interna' }
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function NewsPostCard({
  post,
  liked = false,
  likeDisabled = false,
  onToggleLike,
  token = null,
  onPollUpdate,
  canManage = false,
  onUpdated,
  onDeleted,
}: NewsPostCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false)
  const [encuesta, setEncuesta] = useState(post.encuesta)
  const menuRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef(0)
  const isCompact = useMediaQuery('(max-width: 768px)')

  const hasPoll = Boolean(encuesta?.pregunta)
  const typeBadge = postTypeLabel({ ...post, encuesta })

  useEffect(() => {
    setEncuesta(post.encuesta)
  }, [post.encuesta])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const authorName = post.autor?.trim() || 'Administración'
  const cargo = post.autorSector?.trim() || 'Grupo Núcleo'
  const sede = post.autorSucursal?.trim() || ''
  const roleLine = [cargo, sede].filter(Boolean).join(' • ')
  const timeRelative = formatRelativeTime(post.fecha)
  const images = post.imagenes?.filter(Boolean) ?? []
  const canLike = Boolean(post.id && onToggleLike && !likeDisabled)
  const showExpand = needsExpand(post.contenido)
  const likesCount = post.likes ?? 0

  const openModal = () => setModalOpen(true)

  const handleLike = () => {
    if (!post.id || !onToggleLike || !canLike) return
    setLikeAnimating(true)
    onToggleLike(post.id)
    window.setTimeout(() => setLikeAnimating(false), 320)
  }

  const flashDoubleTapHeart = () => {
    setShowDoubleTapHeart(true)
    window.setTimeout(() => setShowDoubleTapHeart(false), 700)
  }

  const isInteractiveTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    return Boolean(el?.closest('button, a, [role="menu"], input, textarea, select'))
  }

  const handleDoubleLike = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    if (isCompact || isInteractiveTarget(e.target) || !canLike) return
    handleLike()
    flashDoubleTapHeart()
  }

  const handleCardTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (isCompact || isInteractiveTarget(e.target) || !canLike) return
    const now = Date.now()
    if (now - lastTapRef.current < 320) {
      e.preventDefault()
      handleLike()
      flashDoubleTapHeart()
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }

  const handleRemove = async () => {
    if (!token || post.id == null) return
    setRemoving(true)
    setRemoveError('')
    try {
      await newsService.remove(post.id, token)
      onDeleted?.(post.id)
      setRemoveOpen(false)
      window.dispatchEvent(new CustomEvent('gn:novedades-changed'))
    } catch {
      setRemoveError('No se pudo eliminar la novedad. Intentá de nuevo.')
    } finally {
      setRemoving(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!isCompact || isInteractiveTarget(e.target)) return
    openModal()
  }

  const showInlinePoll = hasPoll && !isCompact
  const showPollCta = hasPoll && isCompact

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`news-feed-card${isCompact ? ' news-feed-card--tap-open' : ''}`}
        onClick={handleCardClick}
        onDoubleClick={handleDoubleLike}
        onTouchEnd={handleCardTouchEnd}
      >
        {/* Header */}
        <header className="news-feed-card__header">
          <div className="news-feed-card__author-block">
            <div className="news-feed-card__avatar">
              {post.autorFoto ? (
                <img src={post.autorFoto} alt={authorName} />
              ) : (
                getInitials(authorName)
              )}
            </div>
            <div className="news-feed-card__author-info">
              <span className="news-feed-card__author-name">{authorName}</span>
              <span className="news-feed-card__author-meta">{roleLine}</span>
              {timeRelative && <time className="news-feed-card__time">{timeRelative}</time>}
            </div>
          </div>

          <div className="news-feed-card__menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="news-feed-card__menu-btn"
              aria-label="Opciones de publicación"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="news-feed-card__menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); openModal() }}>
                  Ver publicación
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Type badge */}
        <div className="news-feed-card__type-row">
          <span className={`news-feed-card__type-badge${post.importante ? ' news-feed-card__type-badge--important' : ''}`}>
            <span aria-hidden="true">{typeBadge.icon}</span>
            {typeBadge.label}
          </span>
          {post.importante && (
            <span className="news-feed-card__important-pill">
              <Megaphone size={11} strokeWidth={2.5} />
              Destacada
            </span>
          )}
        </div>

        {/* Content */}
        <div className="news-feed-card__content">
          {post.titulo && <h3 className="news-feed-card__title">{post.titulo}</h3>}
          {post.contenido.trim() && (
            <>
              <div className={`news-feed-card__body ${showExpand ? 'news-feed-card__body--clamped' : ''}`}>
                {post.contenido.split('\n').map((paragraph, index) =>
                  paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
                )}
              </div>
              {showExpand && (
                <button type="button" className="news-feed-card__read-more" onClick={openModal}>
                  Ver más
                </button>
              )}
            </>
          )}
        </div>

        {/* Image */}
        {images.length > 0 && (
          <button
            type="button"
            className="news-feed-card__media"
            onClick={openModal}
            aria-label="Ver imagen en detalle"
          >
            <img src={images[0]} alt="" loading="lazy" />
            {images.length > 1 && (
              <span className="news-feed-card__media-count">+{images.length - 1} fotos</span>
            )}
          </button>
        )}

        {/* Stats */}
        <div className="news-feed-card__stats">
          {canLike ? (
            <button
              type="button"
              className={`news-feed-card__stats-like news-feed-card__stats-like--btn${likesCount > 0 || liked ? ' has-likes' : ''}${liked ? ' is-liked' : ''}${likeAnimating ? ' is-animating' : ''}`}
              aria-pressed={liked}
              aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
              onClick={handleLike}
            >
              <Heart size={14} fill={liked ? 'currentColor' : likesCount > 0 ? 'currentColor' : 'none'} strokeWidth={2} />
              {likesCount > 0
                ? `${likesCount} Me gusta`
                : 'Sé el primero en reaccionar'}
            </button>
          ) : (
            <span className={`news-feed-card__stats-like${likesCount > 0 ? ' has-likes' : ''}`}>
              <Heart size={14} fill={likesCount > 0 ? 'currentColor' : 'none'} strokeWidth={2} />
              {likesCount > 0
                ? `${likesCount} Me gusta`
                : 'Sé el primero en reaccionar'}
            </span>
          )}
        </div>

        {/* Encuesta: completa en desktop, botón en móvil */}
        {showInlinePoll && post.id != null && encuesta && (
          <div className="news-feed-card__poll">
            <NewsPoll
              novedadId={post.id}
              encuesta={encuesta}
              token={token}
              disabled={likeDisabled}
              onVote={(next) => {
                setEncuesta(next)
                onPollUpdate?.(post.id!, next)
              }}
            />
          </div>
        )}

        {showPollCta && (
          <div className="news-feed-card__primary-action">
            <button type="button" className="news-feed-card__action-btn" onClick={openModal}>
              <BarChart3 size={18} strokeWidth={2} />
              <span>Completar encuesta</span>
            </button>
          </div>
        )}

        {showDoubleTapHeart && (
          <div className="news-feed-card__dbltap-heart" aria-hidden="true">
            <Heart size={48} fill="currentColor" strokeWidth={1.5} />
          </div>
        )}

        {/* Footer CTA — solo desktop; en móvil se abre con tap en la tarjeta */}
        <footer className={`news-feed-card__footer${canManage ? ' news-feed-card__footer--managed' : ''}${isCompact ? ' news-feed-card__footer--compact' : ''}`}>
          {canManage && (
            <div className="news-feed-card__admin-actions">
              <button
                type="button"
                className="news-feed-card__admin-btn"
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={14} strokeWidth={2.25} />
                Editar
              </button>
              <button
                type="button"
                className="news-feed-card__admin-btn news-feed-card__admin-btn--danger"
                onClick={() => setRemoveOpen(true)}
              >
                <Trash2 size={14} strokeWidth={2.25} />
                Eliminar
              </button>
            </div>
          )}
          {!isCompact && (
            <button type="button" className="news-feed-card__cta" onClick={openModal}>
              Ver publicación
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          )}
        </footer>
      </motion.article>

      <NewsEditModal
        post={editOpen ? post : null}
        token={token}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => onUpdated?.(updated)}
      />

      <ConfirmDialog
        open={removeOpen}
        title="¿Retirar esta novedad del feed?"
        description="La publicación dejará de mostrarse en el feed de novedades."
        confirmLabel="Eliminar"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => {
          setRemoveOpen(false)
          setRemoveError('')
        }}
      />

      {removeError && (
        <p className="news-feed-card__remove-error" role="alert">{removeError}</p>
      )}

      <NewsPostModal
        post={post}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        liked={liked}
        likeDisabled={likeDisabled}
        onToggleLike={onToggleLike}
        token={token}
        onPollUpdate={onPollUpdate}
      />
    </>
  )
}
