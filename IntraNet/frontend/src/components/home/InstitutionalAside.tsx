type InstitutionalAsideProps = {
  sucursal?: string | null;
  sector?: string | null;
};

// Gestiona la operacion InstitutionalAside.
export function InstitutionalAside({
  sucursal,
  sector,
}: InstitutionalAsideProps) {
  return (
    <aside
      className="gn-aside-card gn-aside-card--institutional"
      aria-label="Información institucional"
    >
      <p className="gn-institutional-brand">Portal interno</p>
      <p className="gn-institutional-quote">
        Construimos juntos el futuro de la empresa, con compromiso,
        transparencia y trabajo en equipo.
      </p>
      {(sector || sucursal) && (
        <dl className="gn-institutional-meta">
          {sector ? (
            <div>
              <dt>Área</dt>
              <dd>{sector}</dd>
            </div>
          ) : null}
          {sucursal ? (
            <div>
              <dt>Sucursal</dt>
              <dd>{sucursal}</dd>
            </div>
          ) : null}
        </dl>
      )}
    </aside>
  );
}
