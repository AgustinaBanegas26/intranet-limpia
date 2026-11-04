# Documentación técnica integral

## 0. Vista general

El repositorio implementa una intranet para empleados y administración. La
solución tiene tres piezas: una SPA React/TypeScript, una API REST Node.js y
Express, y una base PostgreSQL gestionada por Supabase. El frontend y el
backend se instalan y ejecutan por separado; no hay un comando de desarrollo
raíz que inicie ambos procesos.

### Arquitectura y flujo de datos

```text
Navegador (React + Vite + PWA)
  ├─ rutas, formularios, estado de sesión y vistas por rol
  └─ servicios frontend → API REST (VITE_BACKEND_URL)
                              ├─ autenticación y permisos
                              ├─ servicios de dominio
                              └─ Supabase PostgreSQL (clave privada sólo aquí)
```

La API Express es el punto principal para autenticar y acceder a las funciones
de negocio. Los servicios backend agrupan las consultas Supabase por dominio.
El frontend crea además un cliente Supabase con variables públicas
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; no se debe incluir una clave
privilegiada en esas variables.

Algunos datos auxiliares se guardan en JSON en el servidor: bloqueos de acceso,
registros de actividad y metadatos de importación del slider. El slider usa
Supabase para sus registros y conserva compatibilidad con los archivos JSON
históricos. Estos archivos locales no sustituyen a la base principal y deben
considerarse al configurar persistencia del servidor.

### Organización del repositorio

| Ruta | Responsabilidad |
| --- | --- |
| `IntraNet/frontend/src/App.tsx` | Restaura la sesión y compone el flujo público o autenticado. |
| `IntraNet/frontend/src/routes/` | Rutas y restricciones de acceso del cliente. |
| `IntraNet/frontend/src/pages/` | Pantallas de los módulos del portal. |
| `IntraNet/frontend/src/components/` | Componentes compartidos, formularios y paneles. |
| `IntraNet/frontend/src/context/` | Estado de autenticación, tema e instalación PWA. |
| `IntraNet/frontend/src/services/` | Clientes HTTP y operaciones de cada dominio. |
| `IntraNet/frontend/src/utils/` | Validaciones, formato y funciones auxiliares. |
| `IntraNet/backend/src/index.js` | Inicialización Express, middleware y endpoints REST. |
| `IntraNet/backend/src/services/` | Acceso a datos y reglas de los módulos de negocio. |
| `IntraNet/backend/src/middleware/` | Autenticación JWT y configuración CORS. |
| `IntraNet/backend/src/config/` | Cliente Supabase y validación de variables de entorno. |
| `IntraNet/backend/src/fakeDb/` | Adaptadores históricos y almacenamiento JSON local. |
| `IntraNet/backend/src/data/` | Datos y metadatos JSON usados por el backend. |
| `IntraNet/backend/scripts/` | Verificación, inicialización de usuarios y pruebas smoke. |
| `IntraNet/backend/test/` | Pruebas automatizadas del backend. |
| `supabase/estructura.sql` | Esquema SQL de referencia. |
| `supabase/migrations/` | Cambios SQL incrementales; deben aplicarse al proyecto correcto. |

### Módulos funcionales

El frontend agrupa pantallas para inicio, empleados, perfil, novedades,
notificaciones, eventos, beneficios, ausencias, vacaciones, viáticos,
adelantos, rendiciones, reservas/solicitudes, insumos técnicos, calendario,
políticas, sugerencias, manuales y mensajería. `src/routes/index.tsx`
determina qué pantallas se muestran según el rol.

El backend expone los dominios equivalentes en `src/index.js` y delega las
operaciones en servicios como `empleados.service.js`, `novedades.service.js`,
`solicitudes.service.js`, `ausencias.service.js`, `vacaciones.service.js`,
`rendiciones.service.js`, `technicalSupplies.service.js` y los demás archivos
de `src/services/`. Los métodos HTTP y las rutas concretas se encuentran en
ese archivo; `IntraNet/backend/SYNC.md` mantiene el resumen de sincronización.

### Roles y límites de autorización

Los roles admitidos son `empleado`, `rrhh`, `director` y `admin`. El backend
resuelve el rol del empleado, autentica el JWT y valida permisos en cada
endpoint protegido. El frontend también oculta o restringe rutas para guiar la
navegación, pero esas restricciones no reemplazan la autorización del servidor.
Los permisos efectivos están centralizados principalmente en
`IntraNet/backend/src/utils/roles.js` y `IntraNet/frontend/src/context/AuthContext.tsx`.

### Autenticación y sesión

El login compara el hash de contraseña del empleado y emite un JWT propio con
vigencia de 24 horas. Las solicitudes protegidas envían el token como bearer.
El middleware valida firma y versión de credenciales; cuando corresponde,
también impide continuar hasta cambiar una contraseña temporal. La recuperación
por correo se detalla en las secciones 1–14 de esta documentación.

### PWA y recursos web

Vite configura React, Tailwind y `vite-plugin-pwa`. El build genera iconos,
comprueba TypeScript y crea los recursos de producción. La PWA usa actualización
automática y estrategias de caché para recursos estáticos, imágenes y algunas
solicitudes Supabase; las rutas de autenticación y API están excluidas de caché
persistente mediante `NetworkOnly` para rutas cuyo path contiene `/auth/` o
empieza con `/api/`; verificar `vite.config.ts` antes de cambiar la estrategia
de caché de cualquier endpoint.

### Variables de entorno

| Aplicación | Variables principales | Uso |
| --- | --- | --- |
| Backend | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET` | Base de datos, firma y validación de sesiones. |
| Backend | `CORS_ORIGINS`, `PORT`, `NODE_ENV` | Acceso entre orígenes y ejecución del servidor. |
| Backend | `FRONTEND_URL`, `SMTP_USER`/`EMAIL_USER`, `SMTP_APP_PASSWORD`/`EMAIL_PASS` | Enlaces y envío de correo de recuperación. |
| Frontend | `VITE_BACKEND_URL` | Origen de la API REST. |
| Frontend | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Cliente Supabase público; nunca colocar aquí una clave `service_role`. |

Los ejemplos están en `IntraNet/backend/.env.example` y
`IntraNet/frontend/.env.example`. Los archivos `.env`, `.env.local` y las
credenciales reales no deben versionarse ni copiarse a la documentación.

### Instalación, desarrollo y comprobaciones

Desde `IntraNet/backend`, instalar dependencias, copiar `.env.example` a `.env`
y ejecutar `npm run dev`. Desde `IntraNet/frontend`, instalar dependencias,
definir `VITE_BACKEND_URL` en `.env.local` y ejecutar `npm run dev`. Son dos
procesos independientes. En producción, el frontend se construye con
`npm run build`; el backend se inicia con `npm start`.

Comandos de validación:

| Directorio | Comando | Resultado |
| --- | --- | --- |
| Backend | `npm test` | Ejecuta pruebas con el test runner nativo de Node.js. |
| Backend | `npm run check:env` | Valida variables requeridas para el entorno. |
| Backend | `npm run smoke` | Comprueba una ruta de servicio contra el backend configurado. |
| Frontend | `npm run lint` | Analiza TypeScript y TSX con ESLint. |
| Frontend | `npm run build` | Genera iconos PWA, comprueba tipos y compila el sitio. |

`npm run smoke` puede requerir que la API esté activa y que el entorno de
prueba tenga acceso a Supabase; no es una prueba unitaria aislada.

### Esquema y estado de integración

`supabase/estructura.sql` es el esquema de referencia versionado y la carpeta
`supabase/migrations/` contiene los cambios incluidos en el repositorio. Antes
de desplegar, se debe comparar ese contenido con el proyecto Supabase objetivo
y aplicar las migraciones pendientes. Las descripciones
`IntraNet/backend/SCHEMA.md` y `IntraNet/backend/SYNC.md` acompañan el esquema y
la integración; ante diferencias, revisar el código de servicios y la base de
datos activa, ya que el estado remoto no se puede inferir sólo del repositorio.

### Mantenimiento de la documentación del código

Las funciones con nombre y los bucles tienen comentarios breves inmediatamente
antes de su definición. Los callbacks anónimos se mantienen sin comentarios
individuales para evitar repetir texto en handlers y expresiones inline; sus
responsabilidades se explican en la documentación de cada módulo.

---

## Recuperación de contraseña

## 1. Arquitectura general

La aplicación se compone de una SPA React 18 + TypeScript + Vite y una API Node.js + Express 5. Supabase PostgreSQL guarda empleados y sus contraseñas cifradas mediante bcrypt. El acceso web y su recuperación se ejecutan en Express; la aplicación ya no llama a Supabase Auth para validar sesiones, crear cuentas, recuperar contraseñas ni actualizarlas.

El login normal sigue el flujo que ya existía: `POST /auth/login` consulta `empleados`, compara `password_hash` con bcrypt, aplica el bloqueo del login y firma un JWT propio con `JWT_SECRET`. El frontend guarda ese JWT y lo envía como `Authorization: Bearer …` a las rutas protegidas.

La tabla `empleados` ya contiene `email_corporativo`, `password_hash`, `activo`, `role` y `must_change_password`. No se duplica la tabla de empleados. La recuperación añade una tabla separada sólo para códigos temporales y un contador `credential_version` para revocar JWT anteriores.

La tabla mantiene la columna `auth_user_id` por compatibilidad con filas antiguas; las altas nuevas la dejan en `NULL` y las filas/usuarios históricos no se borran. El middleware sólo acepta el JWT propio del portal. Las cuentas antiguas enlazadas a Auth deben usar el login propio; la migración no elimina datos históricos.

## 2. Estructura de carpetas relevante

```text
IntraNet/
  backend/
    src/index.js                         API Express y endpoints
    src/middleware/auth.js               validación del JWT propio y versión
    src/services/empleados.service.js    búsquedas y actualización de empleados
    src/services/passwordRecovery.service.js códigos, SMTP, hashes y RPC
    src/utils/passwordRecoveryCrypto.js  primitivas criptográficas aisladas
    src/fakeDb/users.js                  adaptador de login y bloqueos de acceso
    src/config/supabase.js               cliente administrativo de PostgreSQL
    .env.example                         nombres de variables del backend
    test/passwordRecoveryCrypto.test.js pruebas unitarias de aleatoriedad/hash
  frontend/
    src/App.tsx                          rutas públicas/privadas de la SPA
    src/pages/auth/LoginPage.tsx         ingreso y acceso a recuperación
    src/pages/auth/ResetPasswordPage.tsx solicitud, código y nueva contraseña
    src/services/auth.ts                 login y cambio de clave existentes
    src/services/passwordRecovery.ts     llamadas HTTP de recuperación
    .env.example                         URL pública del backend para Vite
supabase/
  estructura.sql                         esquema anterior de referencia
  migrations/20261104_password_recovery.sql migración nueva y funciones SQL
DOCUMENTACION_TECNICA.md                 este documento
```

## 3. Archivos y responsabilidades

| Archivo | Responsabilidad y relación |
| --- | --- |
| `IntraNet/backend/src/index.js` | Inicializa Express, CORS, Helmet y rate limit global. Contiene login y los tres endpoints públicos de recuperación. Usa el servicio de recuperación y el servicio de empleados. |
| `IntraNet/backend/src/services/passwordRecovery.service.js` | Genera códigos con `crypto`, crea hashes SHA-256/HMAC, consulta empleados, entrega correo vía Nodemailer y ejecuta RPC transaccionales. No devuelve el código al frontend. |
| `IntraNet/backend/src/utils/passwordRecoveryCrypto.js` | Aísla la generación aleatoria y los hashes para poder probarlos sin Supabase ni SMTP. |
| `IntraNet/backend/test/passwordRecoveryCrypto.test.js` | Comprueba largo/forma del código, diversidad de valores y hashes. No simula migraciones ni entrega de correo. |
| `IntraNet/backend/src/services/empleados.service.js` | Usa las consultas existentes de `empleados`; las altas guardan el hash propio sin crear usuario Auth, `verifyEmployeePassword` compara bcrypt y `updateEmployeePassword` llama a la RPC que revoca sesiones para el cambio autenticado. |
| `IntraNet/backend/src/fakeDb/users.js` | Adapta la fila de empleado al modelo que consume `/auth/login` y conserva el bloqueo local de intentos del login. El nombre `fakeDb` es histórico: la búsqueda de credenciales delega en Supabase. |
| `IntraNet/backend/src/middleware/auth.js` | Valida JWT propios contra `credential_version`. Las rutas protegidas pasan por este middleware. |
| `IntraNet/backend/.env.example` | Enumera la configuración del backend. SMTP debe configurarse con credenciales reales en el entorno privado, nunca en frontend. |
| `IntraNet/frontend/src/pages/auth/LoginPage.tsx` | Presenta el acceso y solicitud inicial; remite el correo al backend y muestra la misma respuesta genérica. |
| `IntraNet/frontend/src/pages/auth/ResetPasswordPage.tsx` | UI de los cuatro estados: pedir código, verificarlo, ingresar contraseña y confirmar éxito. |
| `IntraNet/frontend/src/services/passwordRecovery.ts` | Convierte las operaciones de UI en solicitudes JSON a Express y normaliza errores. No almacena contraseña ni código en localStorage. |
| `IntraNet/frontend/src/App.tsx` | Publica `/reset-password` para usuarios sin iniciar sesión. La ruta estaba creada previamente; se actualizó su pantalla. |
| `supabase/migrations/20261104_password_recovery.sql` | Crea almacenamiento, índices, restricciones de acceso, revocación de JWT y funciones atómicas. Debe aplicarse en el proyecto Supabase antes del despliegue. |

## 4. Endpoints

Todos usan JSON. Las solicitudes de recuperación no llevan JWT: justamente se usan cuando la persona no puede iniciar sesión.

### `POST /auth/password-recovery/request`

Entrada: `{ "email": "persona@empresa.com" }`. Valida el formato, busca una cuenta activa por coincidencia exacta de `email_corporativo`, crea un código de 256 bits sólo para una cuenta válida y delega el registro/límite a `request_password_recovery`. Responde `202` con el mismo texto genérico si se encontró o no la cuenta. El código llega por correo, nunca en la respuesta HTTP.

El límite persistente es de tres solicitudes por hora por correo y por IP. Hay también límite Express por IP de cinco solicitudes cada quince minutos. Una solicitud nueva permitida invalida el código anterior del mismo empleado.

### `POST /auth/password-recovery/verify`

Entrada: `{ "email": "…", "code": "64 caracteres hexadecimales" }`. La función SQL comprueba vencimiento y código, y aumenta de forma atómica el contador cuando falla. Hay un máximo de cinco intentos por código y un límite adicional de Express de diez verificaciones cada quince minutos por IP. Respuesta correcta: `{ "ok": true }`; errores: respuesta genérica de código inválido/vencido.

### `POST /auth/password-recovery/reset`

Entrada: `{ "email": "…", "code": "…", "password": "…" }`. Revalida código verificado y vigencia, produce el hash bcrypt con costo 10 como el servicio actual y llama a una función SQL que, dentro de una transacción, actualiza `empleados.password_hash`, desactiva `must_change_password`, incrementa `credential_version` y consume todas las solicitudes del empleado. Requiere 8 caracteres como mínimo y no más de 72 bytes para evitar truncamiento de bcrypt.

## 5. Funciones principales

### Backend

- `generateRecoveryCode()`: crea 32 bytes aleatorios con el módulo nativo `crypto` y los expresa en hexadecimal. Se ejecuta al solicitar el código para un empleado activo.
- `hashRecoveryValue(value)`: aplica SHA-256 al código antes de guardarlo y antes de comparar. La tabla nunca guarda el código recibido por email.
- `hashRateLimitValue(value)`: usa HMAC-SHA-256 con `JWT_SECRET` para almacenar identificadores no reversibles de correo e IP.
- `findActiveEmployeeByEmail(email)`: consulta sólo columnas mínimas de un empleado activo usando igualdad exacta; no usa búsqueda aproximada.
- `createRecoveryTransporter()` y `sendRecoveryCode(employee, code)`: configuran Nodemailer usando `EMAIL_USER`/`EMAIL_PASS` y entregan el código. Si falta SMTP, no simulan un envío exitoso.
- `requestRecovery(email, ip)`: reúne búsqueda, generación, hashes, RPC de límite e invalidación y envío. Si falla correo, intenta invalidar el código nuevo; no registra información sensible.
- `verifyRecoveryCode(email, code)`: solicita a la RPC que incremente intentos o marque el código verificado.
- `resetPassword(email, code, password)`: produce bcrypt y usa la RPC transaccional de reemplazo de contraseña.
- `authenticateToken(req, res, next)`: al validar un JWT propio compara el `credentialVersion` firmado con `empleados.credential_version`. Si no coincide, rechaza la sesión antigua.
- `updateEmployeePassword(userId, newPassword)`: conserva el cambio de contraseña autenticado que ya existía y llama a la nueva RPC para actualizar el hash e incrementar la versión. El endpoint emite un JWT nuevo.

### Frontend

- `requestPasswordRecovery(email)`, `verifyPasswordRecovery(email, code)` y `resetPasswordWithCode(email, code, password)`: funciones de servicio que hacen `fetch` al backend y traducen respuestas JSON.
- `ResetPasswordPage()`: mantiene correo, código y formularios en estado React. Verifica la coincidencia local de contraseñas para ayudar al empleado, pero la validación de seguridad vuelve a realizarse en backend.
- `LoginPage()`: el enlace “¿Olvidaste tu contraseña?” envía la solicitud al backend y ofrece continuar a la pantalla de código. Ya no importa ni invoca `supabase.auth.resetPasswordForEmail`.

## 6. Flujo completo

1. Desde Login, el empleado ingresa su correo y el navegador envía JSON a Express.
2. Express normaliza el correo y consulta `empleados.email_corporativo` y `activo` mediante el cliente privado Supabase.
3. El backend crea 32 bytes aleatorios; obtiene el SHA-256 del código y HMAC del correo/IP. A SQL sólo llega material derivado, no el código ni esos identificadores sin procesar.
4. `request_password_recovery` cuenta solicitudes de la última hora, bloquea concurrencia con advisory locks, marca como usadas solicitudes previas y registra la nueva. Para correos desconocidos también registra una fila con empleado/código nulos, lo que permite límites sin revelar existencia.
5. Nodemailer envía el código al correo corporativo activo. El frontend recibe el mismo mensaje genérico con independencia de la existencia de la cuenta.
6. La pantalla envía email + código a `/verify`. SQL bloquea la fila más reciente, comprueba expiración y limita intentos.
7. La persona crea y confirma la contraseña. El servicio calcula bcrypt y manda sólo el hash a `reset_employee_password_with_recovery`.
8. La función SQL actualiza al empleado, incrementa la versión de credenciales y consume solicitudes abiertas en una transacción. Al iniciar sesión, `/auth/login` compara el bcrypt y firma un JWT con la versión vigente. JWT anteriores dejan de autenticar.

## 7. Tabla y operaciones SQL

`password_recovery_requests` contiene:

| Columna | Uso |
| --- | --- |
| `id` | Identificador UUID de la solicitud. |
| `empleado_id` | Referencia opcional a `empleados.id`; queda nula si no existe la cuenta o si se elimina. |
| `email_hash`, `ip_hash` | HMAC para rate limit sin guardar email/IP en claro. |
| `token_hash` | SHA-256 del código; nulo para una solicitud de correo desconocido. |
| `requested_at`, `expires_at` | Creación y vencimiento a los 15 minutos. |
| `used_at`, `verified_at` | Invalidación/uso y verificación satisfactoria. |
| `attempts` | Intentos equivocados (máximo cinco). |

La tabla tiene RLS activa y permisos de tabla revocados para `PUBLIC`, `anon` y `authenticated`; sólo el backend con `SUPABASE_SERVICE_KEY` puede operar. Las RPC con `SECURITY DEFINER` son las únicas operaciones públicas internas necesarias y sólo `service_role` puede ejecutarlas. Las solicitudes de más de una hora se eliminan de forma oportunista al llegar una solicitud nueva, porque ya no hacen falta para el rate limit. `empleados.credential_version` empieza en cero para mantener vigentes los JWT existentes hasta un cambio de contraseña.

## 8. Comunicación y consultas

React usa `fetch` contra `VITE_BACKEND_URL`, siempre con `Content-Type: application/json`. La pantalla de recuperación es pública y no guarda el código en sesión del navegador. Express valida de nuevo todo dato porque el cliente puede modificarse.

Express usa el cliente creado en `src/config/supabase.js`, que toma URL y clave privada sólo del proceso backend. Las consultas de lectura usan el Query Builder de Supabase (`from('empleados').select(...).eq(...)`). Las operaciones que necesitan atomicidad usan `supabase.rpc(...)`; el SQL no concatena valores de usuario ni expone la tabla de tokens al navegador. No se invocan métodos `supabase.auth` desde el frontend ni el backend.

## 9. Variables de entorno

Backend, en el gestor de secretos del servidor o en `IntraNet/backend/.env` local:

| Variable | Uso |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto PostgreSQL. |
| `SUPABASE_SERVICE_KEY` | Clave privilegiada sólo en backend, necesaria para consultas y RPC. Nunca copiar a `VITE_*`. |
| `JWT_SECRET` | Firma JWT y HMAC de correo/IP; debe ser aleatoria y de al menos 32 caracteres. |
| `SMTP_USER` o `EMAIL_USER` | Cuenta SMTP/Gmail remitente. El servicio de recuperación prioriza `SMTP_USER`; acepta `EMAIL_USER` como nombre anterior. |
| `SMTP_APP_PASSWORD` o `EMAIL_PASS` | Contraseña de aplicación/credencial SMTP. El servicio de recuperación prioriza `SMTP_APP_PASSWORD`; acepta `EMAIL_PASS` como nombre anterior. No es la contraseña normal de correo si el proveedor requiere app password. |
| `FRONTEND_URL` | URL del frontend que aparece en el mensaje; por ejemplo `https://intranet.empresa.com`, sin slash final. |
| `CORS_ORIGINS`, `PORT`, `NODE_ENV` | Configuración general ya existente del backend. |

Frontend:

| Variable | Uso |
| --- | --- |
| `VITE_BACKEND_URL` | Origen de Express, por ejemplo `http://localhost:4000`. |

El ejemplo del repositorio deja los campos SMTP vacíos. El backend ya tiene `nodemailer` y su transporte Gmail; hay que comprobar que el usuario y la contraseña de aplicación actuales sean válidos mediante una prueba real de entrega. No se necesitan claves privadas en React.

## 10. Dependencias

No se agregaron dependencias. Se reutilizan `@supabase/supabase-js` (consultas/RPC), `bcrypt` (hash que ya valida el login), `nodemailer` (SMTP ya usado por notificaciones), `express-rate-limit` (topes por IP) y `express` (endpoints). `crypto` y `Buffer` son módulos nativos de Node.js. Las pruebas usan el módulo integrado `node:test`.

## 11. Seguridad aplicada

- 256 bits aleatorios; SHA-256 del código guardado, expiración de 15 minutos y uso único.
- Intentos de código limitados a cinco por solicitud; solicitudes limitadas a tres por hora tanto por identificador de email como por IP, más limitadores Express por IP.
- Respuesta HTTP genérica ante cuenta existente/desconocida y mensajes que no exponen correo, token, contraseña ni error SMTP.
- Email e IP quedan seudonimizados mediante HMAC con el secreto del servidor.
- RLS y grants impiden acceso directo de usuarios web a la tabla de recuperación; `service_role` no sale del backend.
- Hash bcrypt reutilizado con costo 10. Límite de contraseña en bytes por el máximo efectivo de bcrypt.
- RPC transaccional consume el código y actualiza contraseña; otra solicitud activa también queda invalidada.
- Incremento de `credential_version` revoca JWT propios anteriores. El token nuevo se emite sólo después de la actualización.
- No se registran valores sensibles. Errores de solicitud registran solamente un código genérico.

## 12. Instalar y probar

1. Hacer copia de seguridad y ejecutar `supabase/migrations/20261104_password_recovery.sql` en el SQL Editor del proyecto. Confirmar que termina sin errores y que aparecen la tabla, la columna y las cinco funciones.
2. Configurar las variables backend descritas arriba y reiniciar Express. No poner `SUPABASE_SERVICE_KEY`, `JWT_SECRET` o `EMAIL_PASS` en variables `VITE_*`.
3. Configurar `VITE_BACKEND_URL` en frontend y arrancar backend/frontend con los scripts existentes (`npm run dev` en cada carpeta correspondiente).
4. Verificar que el proveedor SMTP admite envío desde `EMAIL_USER` y revisar bandeja/spam. `EMAIL_USER` y `EMAIL_PASS` están vacíos en el ejemplo, así que esta prueba requiere credenciales reales.
5. Solicitar un código con un correo de prueba registrado y luego con uno inexistente. La API debe responder el mismo texto; sólo la cuenta activa recibe correo.
6. Probar código correcto, uno incorrecto, un código después de 15 minutos, un código luego de su consumo y seis errores seguidos. El quinto error bloquea la solicitud.
7. Probar tres solicitudes válidas en una hora; una cuarta desde ese correo o IP no debe generar un correo/código adicional. Solicitar otro código dentro del límite invalida el primero.
8. Probar contraseña con menos de ocho caracteres, contraseña que exceda 72 bytes y confirmación distinta; la UI las rechaza y Express vuelve a validar.
9. Completar recuperación; iniciar sesión con la nueva contraseña debe funcionar. La anterior debe fallar. Una sesión JWT que estaba iniciada antes del cambio debe ser rechazada y pedir nuevo login.

Para un ensayo controlado conviene usar una cuenta de prueba desechable y un buzón del equipo. No usar la contraseña anterior o actual de una persona real para comprobar el flujo.

## 13. Errores frecuentes

| Síntoma | Causa probable / solución |
| --- | --- |
| La pantalla no conecta con Express | Comprobar que backend corre y que `VITE_BACKEND_URL` tiene esquema/puerto correctos; revisar CORS. |
| El endpoint responde el texto genérico, pero no llega el correo | Revisar logs del backend sólo por el código de error, configurar `EMAIL_USER`/`EMAIL_PASS`, confirmar app password, SMTP y carpeta spam. La respuesta genérica es intencional y no afirma entrega. |
| RPC `function not found` o falta columna | No se aplicó la migración en ese proyecto, se aplicó a otro Supabase o la función fue editada sin actualizar su firma. |
| `permission denied` en RPC/tabla | Confirmar `SUPABASE_SERVICE_KEY` privada, que los grants de la migración se ejecutaron y que la instancia reinició con las variables correctas. |
| El código siempre se rechaza | Revisar que email coincida con el correo corporativo, espacios al copiar, que no pasaran 15 minutos y que no se agotaran cinco intentos. Solicitar uno nuevo. |
| La nueva contraseña se rechaza en login | Confirmar que el endpoint reportó éxito, que backend apunta a la misma base y que la cuenta está activa. No editar `password_hash` manualmente. |
| JWT existente dejó de funcionar tras cambio | Es esperado: debe iniciarse sesión de nuevo. Si ocurre inmediatamente sin cambiar contraseña, revisar valor de `credential_version` y despliegue de middleware/migración. |
| Contraseña muy larga | bcrypt procesa como máximo 72 bytes; reducir longitud, considerando que caracteres no ASCII pueden ocupar más de un byte. |

## 14. Estado de verificación de esta entrega

Se ejecutó `npm.cmd test` en backend: 16 pruebas pasaron, incluidas las tres nuevas de aleatoriedad y hashing. La sintaxis JavaScript y `git diff --check` también pasaron. `npx.cmd tsc --noEmit` reportó errores preexistentes en `EventsAdminPanel`, `ErrorBoundary`, `ProductUI`, `AdelantosPage`, `AdminDashboard`, `EmployeesPage`, `ProfilePage`, `TechnicalSuppliesPage` y `VacationsPage`; no reportó errores en los archivos nuevos o modificados de recuperación.

Las pruebas de integración enumeradas en la sección anterior no se ejecutaron: la migración todavía debe instalarse en Supabase y `FRONTEND_URL` aún debe configurarse. El panel de producción muestra `SMTP_USER` y `SMTP_APP_PASSWORD`, y el servicio de recuperación ya reconoce esos nombres, pero la captura no permite comprobar sus valores ni la entrega real. Hasta aplicar la migración y recibir un correo de prueba, el flujo completo no se puede declarar probado.
