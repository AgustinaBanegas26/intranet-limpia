import { Link } from "react-router";
import { Megaphone } from "lucide-react";
import { getInitials } from "../../context/AuthContext";
import type { NovedadDTO } from "../../services/news";
import { formatPublishDateShort } from "../../utils/formatPublishDate";

type Props = {
  post: NovedadDTO;
};

function summary(text: string, max = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

export function NewsPostCompact({ post }: Props) {
  const authorName = post.autor?.trim() || "Administración";
  const meta = [post.autorSector, post.autorSucursal]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="news-compact-card">
      <div className="news-compact-head">
        <div className="news-compact-avatar">
          {post.autorFoto ? (
            <img src={post.autorFoto} alt={authorName} />
          ) : (
            getInitials(authorName)
          )}
        </div>
        <div className="news-compact-meta">
          <strong>{authorName}</strong>
          <span>{meta || "Organización"}</span>
          {post.fecha && <time>{formatPublishDateShort(post.fecha)}</time>}
        </div>
        {post.importante && (
          <span className="news-compact-badge">
            <Megaphone size={11} />
            Importante
          </span>
        )}
      </div>

      {post.titulo && <h3 className="news-compact-title">{post.titulo}</h3>}
      <p className="news-compact-summary">{summary(post.contenido)}</p>

      <Link to="/novedades" className="news-compact-link">
        Ver publicación →
      </Link>
    </article>
  );
}
