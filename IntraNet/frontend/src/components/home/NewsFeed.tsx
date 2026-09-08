import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Newspaper, Sparkles } from 'lucide-react'
import { canPublishNovedades, useAuth, type User } from '../../context/AuthContext'
import { newsService, type EncuestaDTO, type NovedadDTO } from '../../services/news'
import { NewsPostCard } from './NewsPostCard'

type NewsFeedProps = {
  token: string | null
  showFooterCta?: boolean
  showHeading?: boolean
  showModuleHeader?: boolean
  refreshKey?: number
  maxPosts?: number
}

function countRecentPosts(posts: NovedadDTO[], hours = 48) {
  const cutoff = Date.now() - hours * 3_600_000
  return posts.filter((post) => {
    if (!post.fecha) return false
    const parsed = Date.parse(post.fecha)
    return !Number.isNaN(parsed) && parsed >= cutoff
  }).length
}

function canManagePost(post: NovedadDTO, user: User, isAdmin: boolean) {
  if (!canPublishNovedades(user)) return false
  if (isAdmin) return true
  return post.publicadoPor != null && user.id != null && String(post.publicadoPor) === String(user.id)
}

export function NewsFeed({
  token,
  showFooterCta = false,
  showHeading = true,
  showModuleHeader = false,
  refreshKey = 0,
  maxPosts,
}: NewsFeedProps) {
  const { user, isAdmin } = useAuth()
  const [posts, setPosts] = useState<NovedadDTO[]>([])
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [apiReady, setApiReady] = useState(false)

  const loadPosts = useCallback(() => {
    setLoading(true)
    newsService
      .getAll(token)
      .then((response) => {
        const rows = response.data ?? []
        setPosts(rows)
        setApiReady(true)
        const initialLikes: Record<string, boolean> = {}
        rows.forEach((post) => {
          if (post.id != null && post.liked) {
            initialLikes[String(post.id)] = true
          }
        })
        setLikedMap(initialLikes)
      })
      .catch(() => {
        setPosts([])
        setApiReady(false)
      })
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    loadPosts()
  }, [loadPosts, refreshKey])

  const handleToggleLike = useCallback(
    async (id: string | number) => {
      const key = String(id)
      const wasLiked = likedMap[key] ?? false
      setLikedMap((prev) => ({ ...prev, [key]: !wasLiked }))
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id
            ? { ...post, likes: Math.max(0, (post.likes ?? 0) + (wasLiked ? -1 : 1)) }
            : post
        )
      )
      try {
        const result = await newsService.like(id, token)
        setLikedMap((prev) => ({ ...prev, [key]: result.liked }))
        setPosts((prev) =>
          prev.map((post) => (post.id === id ? { ...post, likes: result.likes, liked: result.liked } : post))
        )
      } catch {
        setLikedMap((prev) => ({ ...prev, [key]: wasLiked }))
        setPosts((prev) =>
          prev.map((post) =>
            post.id === id
              ? { ...post, likes: Math.max(0, (post.likes ?? 0) + (wasLiked ? 1 : -1)) }
              : post
          )
        )
      }
    },
    [likedMap, token]
  )

  const handlePollUpdate = useCallback((id: string | number, encuesta: EncuestaDTO) => {
    setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, encuesta } : post)))
  }, [])

  const handlePostUpdated = useCallback((updated: NovedadDTO) => {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? { ...post, ...updated } : post)))
  }, [])

  const handlePostDeleted = useCallback((id: string | number) => {
    setPosts((prev) => prev.filter((post) => post.id !== id))
  }, [])

  const visiblePosts = useMemo(
    () => (maxPosts != null ? posts.slice(0, maxPosts) : posts),
    [posts, maxPosts]
  )
  const newCount = useMemo(() => countRecentPosts(posts), [posts])

  return (
    <section className={`news-module ${showModuleHeader ? 'news-module--dashboard' : ''}`}>
      {showModuleHeader && (
        <header className="news-module__header">
          <div className="news-module__title-group">
            <div className="news-module__icon" aria-hidden="true">
              <Newspaper size={18} strokeWidth={2.2} />
            </div>
            <div>
              <p className="news-module__eyebrow">Comunicación interna</p>
              <h2 className="news-module__title">Novedades</h2>
            </div>
            {!loading && newCount > 0 && (
              <span className="news-module__badge">
                <Sparkles size={12} />
                {newCount} {newCount === 1 ? 'nueva' : 'nuevas'}
              </span>
            )}
          </div>
          <Link to="/novedades" className="news-module__link">
            Ver todas
            <ArrowRight size={15} />
          </Link>
        </header>
      )}

      {showHeading && !showModuleHeader && (
        <div className="news-module__simple-heading">
          <h2>Novedades corporativas</h2>
          <p>Comunicaciones oficiales de Grupo Núcleo</p>
        </div>
      )}

      {loading ? (
        <div className="news-feed-skeleton">
          {[1, 2].map((i) => (
            <div key={i} className="news-feed-skeleton__card" />
          ))}
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="news-feed-empty">
          <div className="news-feed-empty__icon">
            <Newspaper size={24} />
          </div>
          <h3>Sin novedades publicadas</h3>
          <p>Las comunicaciones corporativas aparecerán aquí.</p>
        </div>
      ) : (
        <div className="news-feed-list">
          {visiblePosts.map((post) => (
            <NewsPostCard
              key={String(post.id)}
              post={post}
              liked={post.id != null ? likedMap[String(post.id)] : false}
              likeDisabled={!apiReady}
              onToggleLike={apiReady ? handleToggleLike : undefined}
              token={token}
              onPollUpdate={handlePollUpdate}
              canManage={canManagePost(post, user, isAdmin)}
              onUpdated={handlePostUpdated}
              onDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}

      {showFooterCta && (
        <div className="news-module__footer-cta">
          <Link to="/novedades">
            Ver todas las novedades
            <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </section>
  )
}
