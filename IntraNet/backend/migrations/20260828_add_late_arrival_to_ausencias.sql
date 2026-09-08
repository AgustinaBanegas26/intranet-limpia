-- Las llegadas tarde reutilizan la tabla y el circuito de ausencias.
-- Ejecutar una sola vez en la base de datos de Supabase antes de desplegar el backend.
ALTER TABLE public.ausencias
  ADD COLUMN IF NOT EXISTS hora_desde time without time zone,
  ADD COLUMN IF NOT EXISTS hora_hasta time without time zone;

ALTER TABLE public.ausencias
  DROP CONSTRAINT IF EXISTS ausencias_llegada_tarde_horario_check;

ALTER TABLE public.ausencias
  ADD CONSTRAINT ausencias_llegada_tarde_horario_check
  CHECK (
    tipo <> 'llegada_tarde'
    OR (
      hora_desde IS NOT NULL
      AND hora_hasta IS NOT NULL
      AND hora_hasta > hora_desde
    )
  );
