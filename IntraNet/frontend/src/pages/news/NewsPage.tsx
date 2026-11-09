// Pantalla del frontend: combina componentes React, estado y servicios para presentar este módulo al usuario. Tema específico: novedades y publicaciones.
import { useState } from "react";
import { NewsFeed } from "../../components/home/NewsFeed";
import { NewsComposer } from "../../components/news/NewsComposer";
import { PageHero } from "../../components/ui/ProductUI";
import { canPublishNovedades, useAuth } from "../../context/AuthContext";

// Gestiona la operacion NewsPage.
export function NewsPage() {
  const { token, user } = useAuth();
  const canPublish = canPublishNovedades(user);
  const [refreshKey, setRefreshKey] = useState(0);

  // Gestiona la operacion bumpRefresh.
  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="page-root" style={{ maxWidth: 720, margin: "0 auto" }}>
      <PageHero
        eyebrow="Comunicación"
        title="Novedades"
        description={
          canPublish
            ? "Publicá comunicaciones para todo el equipo. Podés editar o eliminar tus publicaciones desde el feed."
            : "Comunicaciones oficiales de la organización."
        }
      />

      {canPublish && (
        <div style={{ marginBottom: 20 }}>
          <NewsComposer token={token} onPublished={bumpRefresh} />
        </div>
      )}

      <NewsFeed
        token={token}
        showHeading={!canPublish}
        refreshKey={refreshKey}
      />
    </div>
  );
}
