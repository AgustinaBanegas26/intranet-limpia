# Guía de recuperación de contraseñas

Esta guía configura el flujo existente del portal. Express genera y verifica
códigos; PostgreSQL/Supabase guarda hashes y actualiza `empleados`. El portal
no usa Supabase Auth. El frontend nunca recibe credenciales SMTP ni la clave de
servicio.

## Archivos y funciones

- `src/index.js`: expone `POST /auth/password-recovery/request`, `/verify` y
  `/reset`. Valida entradas, devuelve códigos HTTP reales y registra la etapa
  fallida sin incluir correo, token ni contraseña.
- `src/services/passwordRecovery.service.js`: busca empleados activos, genera
  códigos aleatorios, almacena/verifica hashes vía RPC, envía correo con
  Nodemailer y hashea la clave nueva con bcrypt (el mismo algoritmo del login).
- `src/services/recoveryEmailTransport.js`: valida las cinco variables SMTP,
  configura TLS en Nodemailer y expone `verifyRecoveryEmailTransport()` para
  comprobar conexión y autenticación sin enviar correo.
- `src/utils/passwordRecoveryCrypto.js`: genera el código y los hashes SHA-256 /
  HMAC usados por la tabla auxiliar y sus límites.
- `src/config/supabase.js`: crea el cliente privado del backend con
  `SUPABASE_SERVICE_KEY`; no debe importarse desde el frontend.
- `src/config/validateEnv.js`: advierte si falta alguna variable SMTP requerida.
- `scripts/check-smtp.js`: ejecuta la verificación de transporte sin mandar un
  mensaje. Se llama mediante `npm run check:smtp`.
- `../../supabase/migrations/20261104_password_recovery.sql`: crea la tabla y
  funciones RPC del flujo, limita permisos directos y activa RLS.
- `../../supabase/estructura.sql`: describe el esquema base, incluida la tabla
  `empleados` y su política RLS.
- `../frontend/src/services/passwordRecovery.ts` y las páginas
  `../frontend/src/pages/auth/LoginPage.tsx` y
  `../frontend/src/pages/auth/ResetPasswordPage.tsx`: llaman al backend y
  presentan los estados de error/success sin guardar tokens en la sesión.

## Configurar Gmail SMTP

1. Usá una cuenta Gmail autorizada para correo de la aplicación. Activá la
   verificación en dos pasos. Google sólo permite crear contraseñas de
   aplicación cuando esa protección está activa; algunas cuentas Workspace,
   Advanced Protection o con ciertos métodos de segundo factor pueden no tener
   disponible esa opción. Consultá [ayuda oficial de contraseñas de aplicación](https://support.google.com/accounts/answer/185833?hl=es).
2. En la cuenta de Google, abrí Seguridad → Verificación en dos pasos →
   Contraseñas de aplicaciones. Creá una para la intranet y copiá la clave que
   Google muestra. No uses la contraseña normal de Gmail. Si cambiás la
   contraseña de Google, Google revoca las contraseñas de aplicación y habrá
   que generar otra.
3. En el entorno privado del backend (`IntraNet/backend/.env` local o variables
   del proveedor de hosting), configurá:

   ```dotenv
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=cuenta@gmail.com
   SMTP_PASS=CLAVE_DE_APLICACION_DE_GOOGLE
   SMTP_FROM=cuenta@gmail.com
   ```

   `SMTP_FROM` debe ser la cuenta autenticada o un remitente/alias autorizado
   por Gmail. La clave puede pegarse con o sin espacios; el backend los elimina
   al preparar la autenticación. El puerto 465 usa TLS implícito. También se
   admite 587 con STARTTLS obligatorio. Gmail documenta `smtp.gmail.com`,
   autenticación y STARTTLS 587 en su [configuración oficial SMTP](https://support.google.com/mail/answer/7104828?hl=es).
4. No copies esos secretos a `frontend/.env`, al repositorio, a tickets ni a
   logs. `EMAIL_USER` y `EMAIL_PASS` se conservan para notificaciones
   preexistentes y no configuran el envío de recuperación.

## Configurar, arrancar y comprobar SMTP

Desde PowerShell:

```powershell
cd IntraNet/backend
npm run check:env
npm run check:smtp
npm start
```

`check:env` debe listar la advertencia de correo si faltan variables. `check:smtp`
debe terminar con código cero y mostrar que conexión y autenticación fueron
correctas; no manda mensajes. Si falla, el script informa sólo el código/clase
del error. No imprime usuario, clave, código de recuperación ni respuesta SMTP
completa. Revisá host, puerto, usuario, contraseña de aplicación, remitente,
acceso de red saliente y restricciones de Google Workspace.

En otra terminal, iniciá el frontend desde `IntraNet/frontend` (`npm run dev`)
y confirmá que `VITE_BACKEND_URL` apunta al backend. En producción, configurá
las variables SMTP en el servicio backend y desplegá frontend/backend con sus
URLs y CORS correspondientes.

## Contrato SQL revisado

El backend invoca estas funciones; las firmas de la migración restaurada
coinciden con los nombres de argumentos que Supabase RPC recibe:

| RPC | Parámetros Node.js | Firma SQL |
| --- | --- | --- |
| `request_password_recovery` | `p_employee_id`, `p_email_hash`, `p_ip_hash`, `p_token_hash`, `p_expires_at` | `bigint, text, text, text, timestamptz` |
| `verify_password_recovery` | `p_email_hash`, `p_token_hash` | `text, text` |
| `reset_employee_password_with_recovery` | `p_email_hash`, `p_token_hash`, `p_password_hash` | `text, text, text` |
| `invalidate_password_recovery_by_hash` | `p_email_hash`, `p_token_hash` | `text, text` |
| `update_employee_password` (cambio autenticado existente) | `p_employee_id`, `p_password_hash` | `bigint, text` |

El esquema base define `empleados.id bigint`, `email_corporativo`, `activo`,
`password_hash`, `must_change_password` y `updated_at`. La migración añade
`credential_version` y `password_recovery_requests` con `empleado_id bigint`,
hashes de correo/IP/código y fechas `timestamptz`. La migración activa RLS para
la tabla auxiliar, revoca permisos de `PUBLIC`, `anon` y `authenticated`, y
concede acceso al rol privado `service_role`. Las funciones son
`SECURITY DEFINER`, fijan `search_path`, revocan ejecución pública y conceden
`EXECUTE` a `service_role`. El esquema base también activa RLS en `empleados`.

No se desactiva RLS. El backend usa la clave `SUPABASE_SERVICE_KEY` sólo en el
servidor; esa clave no se imprime ni se comparte.

## Comprobar Supabase desde SQL Editor

Ejecutá este bloque de sólo lectura en el proyecto objetivo. No devuelve datos
de empleados ni hashes de credenciales:

```sql
-- Tablas y columnas requeridas.
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'empleados' AND column_name IN (
      'id', 'email_corporativo', 'activo', 'password_hash',
      'must_change_password', 'updated_at', 'credential_version'
    ))
    OR
    (table_name = 'password_recovery_requests' AND column_name IN (
      'id', 'empleado_id', 'email_hash', 'ip_hash', 'token_hash',
      'requested_at', 'expires_at', 'used_at', 'verified_at', 'attempts'
    ))
  )
ORDER BY table_name, ordinal_position;

-- RLS y permisos de tabla por rol.
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       has_table_privilege('service_role', c.oid, 'SELECT') AS service_can_select,
       has_table_privilege('service_role', c.oid, 'INSERT') AS service_can_insert,
       has_table_privilege('service_role', c.oid, 'UPDATE') AS service_can_update,
       has_table_privilege('anon', c.oid, 'SELECT') AS anon_can_select,
       has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_can_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('empleados', 'password_recovery_requests')
ORDER BY c.relname;

-- Políticas RLS de esas tablas.
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('empleados', 'password_recovery_requests')
ORDER BY tablename, policyname;

-- Presencia, firma, SECURITY DEFINER y ejecución por rol de cada RPC.
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_function_result(p.oid) AS result,
       p.prosecdef AS security_definer,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_can_execute,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'request_password_recovery', 'verify_password_recovery',
    'reset_employee_password_with_recovery',
    'invalidate_password_recovery_by_hash', 'update_employee_password'
  )
ORDER BY p.proname;
```

Si faltan la tabla de recuperación, `credential_version` o las RPC, y la tabla
auxiliar no existe con una estructura parcial distinta, aplicá
`../../supabase/migrations/20261104_password_recovery.sql` una sola vez en el
proyecto correcto y repetí las consultas. `CREATE TABLE IF NOT EXISTS` no repara
columnas faltantes de una tabla que ya existe; en ese caso compará el esquema
antes de preparar un `ALTER TABLE` puntual. No ejecutes el esquema base completo
contra una base existente: es una referencia de estructura, no un procedimiento
de actualización segura.

## Probar el flujo real

Después de que `check:smtp` pase y la verificación SQL confirme tablas, columnas,
RLS y RPC:

1. Usá una cuenta de prueba activa cuyo `email_corporativo` puedas recibir.
2. En la pantalla de login, elegí **¿Olvidaste tu contraseña?**, solicitá el
   código y comprobá que llegó por Gmail. El código dura 15 minutos y no aparece
   en logs.
3. Ingresá el código, validalo y establecé una contraseña de al menos 8
   caracteres y como máximo 72 bytes.
4. Volvé al login e iniciá sesión con esa contraseña.
5. Confirmá que la contraseña anterior ya no inicia sesión y que el código no
   se puede reutilizar.

Una respuesta `202` en solicitud significa que el backend terminó su camino de
solicitud sin error SMTP; por privacidad, no confirma si un correo inexistente
está registrado. Los errores de backend se identifican en logs como
`[auth-recovery] ... stage=lookup_employee|store_request|send_email|validate_code|update_password`.
Nunca compartas el archivo `.env` al pedir ayuda.
