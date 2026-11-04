-- Recuperación de contraseña propia del backend (no utiliza Supabase Auth).
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.
CREATE TABLE IF NOT EXISTS public.password_recovery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id bigint REFERENCES public.empleados(id) ON DELETE SET NULL,
  email_hash text NOT NULL,
  ip_hash text NOT NULL,
  token_hash text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  used_at timestamptz,
  verified_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);

COMMENT ON TABLE public.password_recovery_requests IS
  'Solicitudes de recuperación: sólo hashes de correo, IP y código; nunca guarda el código original.';

-- La versión permite revocar JWT propios sin invalidar las cuentas ni cambiar roles..
ALTER TABLE public.empleados
  ADD COLUMN IF NOT EXISTS credential_version integer NOT NULL DEFAULT 0;

-- Mantiene el cambio voluntario de contraseña compatible y revoca los JWT previos.
CREATE OR REPLACE FUNCTION public.update_employee_password(
  p_employee_id bigint,
  p_password_hash text
) RETURNS TABLE (credential_version integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
    UPDATE public.empleados AS empleado
       SET password_hash = p_password_hash,
           must_change_password = false,
           credential_version = empleado.credential_version + 1,
           updated_at = now()
     WHERE empleado.id = p_employee_id
     RETURNING empleado.credential_version;
END;
$$;

CREATE INDEX IF NOT EXISTS password_recovery_email_time_idx
  ON public.password_recovery_requests (email_hash, requested_at DESC);
CREATE INDEX IF NOT EXISTS password_recovery_ip_time_idx
  ON public.password_recovery_requests (ip_hash, requested_at DESC);
CREATE INDEX IF NOT EXISTS password_recovery_employee_pending_idx
  ON public.password_recovery_requests (empleado_id, requested_at DESC)
  WHERE used_at IS NULL;

ALTER TABLE public.password_recovery_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.password_recovery_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.password_recovery_requests TO service_role;

-- Aplica 3 solicitudes por hora, tanto por correo como por IP. Se guarda también
-- una fila cuando el email no existe para que esos pedidos cuenten para el límite.
CREATE OR REPLACE FUNCTION public.request_password_recovery(
  p_employee_id bigint,
  p_email_hash text,
  p_ip_hash text,
  p_token_hash text,
  p_expires_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  email_count integer;
  ip_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email_hash, 1));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash, 2));

  -- Conserva sólo la ventana necesaria para rate limit; la limpieza es oportunista.
  DELETE FROM public.password_recovery_requests
   WHERE requested_at <= now() - interval '1 hour';

  SELECT count(*) INTO email_count
    FROM public.password_recovery_requests
   WHERE email_hash = p_email_hash AND requested_at > now() - interval '1 hour';
  SELECT count(*) INTO ip_count
    FROM public.password_recovery_requests
   WHERE ip_hash = p_ip_hash AND requested_at > now() - interval '1 hour';

  IF email_count >= 3 OR ip_count >= 3 THEN
    RETURN false;
  END IF;

  IF p_employee_id IS NOT NULL THEN
    UPDATE public.password_recovery_requests
       SET used_at = now()
     WHERE empleado_id = p_employee_id AND used_at IS NULL;
  END IF;

  INSERT INTO public.password_recovery_requests
    (empleado_id, email_hash, ip_hash, token_hash, expires_at)
  VALUES
    (p_employee_id, p_email_hash, p_ip_hash, p_token_hash, p_expires_at);

  RETURN true;
END;
$$;

-- Consume hasta cinco intentos por solicitud. El bloqueo de fila evita que dos
-- verificaciones paralelas excedan el máximo de intentos.
CREATE OR REPLACE FUNCTION public.verify_password_recovery(
  p_email_hash text,
  p_token_hash text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  recovery public.password_recovery_requests%ROWTYPE;
BEGIN
  SELECT * INTO recovery
    FROM public.password_recovery_requests
   WHERE email_hash = p_email_hash AND token_hash IS NOT NULL AND used_at IS NULL
   ORDER BY requested_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND OR recovery.attempts >= 5 THEN
    RETURN false;
  END IF;

  IF recovery.expires_at IS NULL OR recovery.expires_at <= now() THEN
    UPDATE public.password_recovery_requests SET used_at = now() WHERE id = recovery.id;
    RETURN false;
  END IF;

  IF recovery.token_hash <> p_token_hash THEN
    UPDATE public.password_recovery_requests
       SET attempts = attempts + 1,
           used_at = CASE WHEN attempts + 1 >= 5 THEN now() ELSE used_at END
     WHERE id = recovery.id;
    RETURN false;
  END IF;

  UPDATE public.password_recovery_requests SET verified_at = now() WHERE id = recovery.id;
  RETURN true;
END;
$$;

-- Confirma el hash bcrypt y consume la solicitud en una única transacción.
-- También anula cualquier otra solicitud abierta para el empleado.
CREATE OR REPLACE FUNCTION public.reset_employee_password_with_recovery(
  p_email_hash text,
  p_token_hash text,
  p_password_hash text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  recovery public.password_recovery_requests%ROWTYPE;
  affected integer;
BEGIN
  SELECT * INTO recovery
    FROM public.password_recovery_requests
   WHERE email_hash = p_email_hash
     AND token_hash = p_token_hash
     AND used_at IS NULL
     AND attempts < 5
     AND verified_at IS NOT NULL
     AND expires_at > now()
   ORDER BY requested_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND OR recovery.empleado_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.empleados
     SET password_hash = p_password_hash,
         must_change_password = false,
         credential_version = credential_version + 1,
         updated_at = now()
   WHERE id = recovery.empleado_id AND activo = true;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected <> 1 THEN
    RETURN false;
  END IF;

  UPDATE public.password_recovery_requests
     SET used_at = now()
   WHERE empleado_id = recovery.empleado_id AND used_at IS NULL;

  RETURN true;
END;
$$;

-- Si falla SMTP tras registrar la solicitud, se invalida únicamente ese código.
CREATE OR REPLACE FUNCTION public.invalidate_password_recovery_by_hash(
  p_email_hash text,
  p_token_hash text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.password_recovery_requests
     SET used_at = now()
   WHERE email_hash = p_email_hash AND token_hash = p_token_hash AND used_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.request_password_recovery(bigint, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_employee_password(bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_password_recovery(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_employee_password_with_recovery(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.invalidate_password_recovery_by_hash(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_password_recovery(bigint, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_employee_password(bigint, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_password_recovery(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_employee_password_with_recovery(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.invalidate_password_recovery_by_hash(text, text) TO service_role;
