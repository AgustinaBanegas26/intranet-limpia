# Intranet

Portal interno para empleados y administradores. El repositorio contiene una aplicación web React/TypeScript, una API REST Node.js/Express y el esquema SQL de referencia para Supabase.

## Mapa rápido

| Necesito encontrar… | Archivo o carpeta |
| --- | --- |
| Todas las rutas HTTP y sus controladores | [`IntraNet/backend/src/index.js`](IntraNet/backend/src/index.js) |
| Autenticación JWT y autorización por rol | [`IntraNet/backend/src/middleware/auth.js`](IntraNet/backend/src/middleware/auth.js), [`IntraNet/backend/src/utils/roles.js`](IntraNet/backend/src/utils/roles.js) |
| Consultas y reglas de un módulo del servidor | [`IntraNet/backend/src/services/`](IntraNet/backend/src/services/) |
| Llamadas HTTP desde el navegador | [`IntraNet/frontend/src/services/`](IntraNet/frontend/src/services/) |
| Rutas y pantallas del frontend | [`IntraNet/frontend/src/routes/index.tsx`](IntraNet/frontend/src/routes/index.tsx), [`IntraNet/frontend/src/pages/`](IntraNet/frontend/src/pages/) |
| Componentes compartidos de la interfaz | [`IntraNet/frontend/src/components/`](IntraNet/frontend/src/components/) |
| Tablas, relaciones e índices de la base | [`supabase/estructura.sql`](supabase/estructura.sql) |
| Cambios incrementales de base de datos | [`supabase/migrations/`](supabase/migrations/) |
| Reglas de recuperación de contraseña | [`IntraNet/backend/RECUPERACION.md`](IntraNet/backend/RECUPERACION.md), [`DOCUMENTACION_TECNICA.md`](DOCUMENTACION_TECNICA.md) |

Los archivos fuente incluyen un comentario inicial que resume su responsabilidad y los conceptos que aplican. Los formatos que no admiten comentarios válidos (JSON, imágenes, manifiestos y archivos de dependencias) se describen en [Datos y recursos](#datos-y-recursos).

## Arquitectura y recorrido de una petición

```text
Navegador React/Vite
  ├─ páginas y componentes muestran la interfaz
  ├─ servicios frontend preparan las llamadas HTTP
  └─ API Express (IntraNet/backend/src/index.js)
       ├─ middleware: CORS, autenticación y controles transversales
       ├─ servicios backend: reglas de negocio y consultas
       └─ Supabase/PostgreSQL
```

El frontend y el backend se instalan y ejecutan por separado. El backend mantiene las credenciales privadas de Supabase. Las variables `VITE_*` son públicas porque se incorporan al bundle del navegador; no deben contener claves privilegiadas.

## API: ubicación de endpoints

**Todas las rutas de la API principal están declaradas en [`IntraNet/backend/src/index.js`](IntraNet/backend/src/index.js).** Los servicios invocados por esas rutas están en `IntraNet/backend/src/services/`. Salvo las rutas públicas de disponibilidad y autenticación, las rutas requieren un token y verifican que la contraseña inicial haya sido cambiada.

| Grupo | Endpoints y operaciones | Controlador/servicio principal |
| --- | --- | --- |
| Salud | `GET /health`: estado del servidor y conexión con Supabase. | `index.js` |
| Acceso | `POST /auth/login`: valida credenciales y emite sesión. `PUT /auth/change-password`: cambia la contraseña de la sesión. | `empleados.service.js`, middleware de autenticación |
| Recuperación | `POST /auth/password-recovery/request`: solicita código. `POST /auth/password-recovery/verify`: valida código. `POST /auth/password-recovery/reset`: establece contraseña nueva. | `passwordRecovery.service.js`, `passwordRecoveryCrypto.js`, `recoveryEmailTransport.js` |
| Empleados | `GET /empleados`, `GET /empleados/:id/perfil`, `POST /empleados`, `PUT /empleados/:id`, `DELETE /empleados/:id`. | `empleados.service.js` |
| Perfil | `GET /profile`, `PUT /profile`: consulta y actualiza el perfil propio. | `empleados.service.js` |
| Sectores | `GET /sectores`, `POST /sectores`, `PUT /sectores/:id`, `DELETE /sectores/:id`. | `sectores.service.js` |
| Novedades | `GET /novedades`, `GET /novedades/mias`, `POST /novedades`, `PUT /novedades/:id`, `DELETE /novedades/:id`, `POST /novedades/:id/like`, `POST /novedades/:id/encuesta/vote`. | `novedades.service.js` |
| Notificaciones | `GET /notificaciones`, `PUT /notificaciones/leer-todas`, `PUT /notificaciones/:id/leer`, `DELETE /notificaciones/todas`, `DELETE /notificaciones/:id`. | `notificaciones.service.js` |
| Solicitudes y calendario | `GET /solicitudes`, `GET /solicitudes/:id`, `GET /calendario/solicitudes`, `POST /solicitudes`, `POST /viaticos`, `PUT /solicitudes/:id/approve`, `PUT /solicitudes/:id/reject`, `DELETE /solicitudes/:id`. | `solicitudes.service.js`, `calendario.service.js` |
| Rendiciones | `GET /rendiciones`, `GET /rendiciones/:id`, `GET /rendiciones/viatico/:viaticoId`, `GET /rendiciones/sync`, `GET /api/rendiciones/sync`; edición de rendición y gastos; envío, aprobación y devolución. | `rendiciones.service.js` |
| Insumos técnicos | `GET/POST /insumos-tecnicos/solicitudes`, `PUT /insumos-tecnicos/solicitudes/:id`, actualización de ficha por empleado, aprobación y rechazo. | `technicalSupplies.service.js` |
| Adelantos | `GET/POST /adelantos`, `PUT /adelantos/:id/approve`, `PUT /adelantos/:id/reject`, `DELETE /adelantos/:id`. | `adelantos.service.js`, `emailService.js` |
| Ausencias | `GET/POST /ausencias`, `PUT /ausencias/:id`, `PUT /ausencias/:id/approve`, `PUT /ausencias/:id/reject`, `DELETE /ausencias/:id`. Incluye llegadas tarde. | `ausencias.service.js` |
| Vacaciones | `GET /vacaciones/saldo`, `GET/POST /vacaciones`, `PUT/DELETE /vacaciones/:id`. | `vacaciones.service.js`, `ausencias.service.js` |
| Carrusel | `GET/POST /slider`, `PUT/DELETE /slider/:id`. | `slider.service.js` |
| Beneficios | `GET/POST /beneficios`, `PUT/DELETE /beneficios/:id`. | `beneficios.service.js` |
| Eventos | `GET/POST /eventos`, `PUT/DELETE /eventos/:id`, `POST /eventos/:id/rsvp`. | `eventos.service.js` |
| Políticas | `GET/POST /politicas`, `PUT/DELETE /politicas/:id`, `POST /politicas/:id/leer`. | `politicas.service.js` |
| Sugerencias | `GET/POST /sugerencias`, `POST /sugerencias/:id/vote`, `PUT /sugerencias/:id/status`, `DELETE /sugerencias/:id`. | `sugerencias.service.js` |
| Manuales | `GET/POST /manuales`, `PUT/DELETE /manuales/:id`. | `manuales.service.js` |
| Mensajes | `GET /mensajes/contactos`, `GET/POST /mensajes`, `PUT /mensajes/:id/leer`, `DELETE /mensajes/:id`. | `mensajes.service.js` |
| Celebraciones | `GET /birthdays`: cumpleaños y aniversarios próximos. | `celebraciones.service.js` |

`GET/POST` en la tabla significa que cada método comparte la ruta indicada. Las rutas exactas, validaciones, códigos de respuesta y permisos se consultan en `index.js`; el README es un mapa para llegar al código y no reemplaza su contrato.

### Archivos auxiliares de API

- [`IntraNet/backend/api/index.js`](IntraNet/backend/api/index.js) exporta la aplicación Express para entornos que la consumen como función, por ejemplo pruebas de integración o despliegues serverless.
- [`IntraNet/backend/api/test.js`](IntraNet/backend/api/test.js) es una respuesta mínima de diagnóstico para el despliegue.

## Funciones de los servicios

### Backend: `IntraNet/backend/src/services/`

Cada servicio agrupa operaciones de negocio y persistencia de su módulo. Las rutas HTTP no deberían duplicar estas reglas.

| Archivo | Responsabilidad |
| --- | --- |
| `adelantos.service.js` | Consultar y gestionar adelantos, estados y datos asociados. |
| `ausencias.service.js` | Validar rangos de fechas/horas y gestionar ausencias, licencias y llegadas tarde. |
| `beneficios.service.js` | Consultar y administrar beneficios. |
| `calendario.service.js` | Preparar eventos del calendario desde solicitudes aprobadas y otras fuentes. |
| `celebraciones.service.js` | Calcular próximos cumpleaños/aniversarios y normalizar datos de personas. |
| `emailService.js` | Preparar correos de notificación, destinatarios y transporte SMTP. |
| `empleados.service.js` | Consultar empleados, perfiles, credenciales y operaciones de administración. |
| `eventos.service.js` | Gestionar eventos institucionales y respuestas/RSVP. |
| `manuales.service.js` | Consultar y administrar manuales internos. |
| `mensajes.service.js` | Gestionar conversaciones, destinatarios y estado de lectura. |
| `notificaciones.service.js` | Crear, listar, clasificar, marcar como leídas y eliminar notificaciones. |
| `novedades.service.js` | Publicaciones, archivos adjuntos, destacados, reacciones y encuestas. |
| `passwordRecovery.service.js` | Crear y verificar flujos de recuperación sin exponer códigos al navegador. |
| `politicas.service.js` | Administrar políticas y registrar lecturas. |
| `recoveryEmailTransport.js` | Crear y verificar el transporte de correo usado específicamente para recuperación. |
| `rendiciones.service.js` | Gestionar rendiciones, gastos, validaciones y transiciones de aprobación. |
| `sectores.service.js` | Administrar sectores y compatibilidad con el almacenamiento local de respaldo. |
| `slider.service.js` | Consultar y administrar las imágenes del carrusel. |
| `solicitudes.service.js` | Crear, consultar y aprobar solicitudes, incluidos viáticos y conceptos relacionados. |
| `sugerencias.service.js` | Gestionar sugerencias, votos y estados. |
| `technicalSupplies.service.js` | Gestionar solicitudes de insumos técnicos y fichas asociadas. |
| `vacaciones.service.js` | Calcular saldo y coordinar solicitudes de vacaciones con el servicio de ausencias. |

### Frontend: `IntraNet/frontend/src/services/`

| Grupo de archivos | Función |
| --- | --- |
| `apiClient.ts`, `api.ts` | Cliente HTTP compartido: URL del backend, encabezados de sesión y respuestas comunes. |
| `auth.ts`, `passwordRecovery.ts` | Inicio/cierre de sesión, cambio de contraseña y solicitudes de recuperación. |
| `profile.ts`, `employees.ts`, `sectores.ts` | Perfil, empleados y sectores. |
| `absences.ts`, `vacations.ts`, `adelantos.ts` | Ausencias, vacaciones y adelantos. |
| `requests.ts`, `calendar.ts`, `rendiciones.ts` | Solicitudes, calendario y rendiciones. |
| `technicalSupplies.ts` | Insumos técnicos. |
| `benefits.ts`, `celebraciones.ts`, `events.ts`, `manuals.ts`, `news.ts`, `notifications.ts`, `policies.ts`, `messages.ts`, `slider.ts`, `suggestions.ts` | Comunicación con los endpoints de cada módulo homónimo. |

## Organización del frontend

- `IntraNet/frontend/src/App.tsx`: restaura la sesión y decide el flujo público o autenticado.
- `IntraNet/frontend/src/routes/index.tsx`: relaciona rutas del navegador con las pantallas y los controles de acceso del cliente.
- `IntraNet/frontend/src/pages/`: pantallas completas de acceso, inicio y módulos de empleados.
- `IntraNet/frontend/src/components/`: controles, formularios, tarjetas, modales, navegación y paneles reutilizables.
- `IntraNet/frontend/src/context/`: estado global de autenticación, tema y experiencia PWA.
- `IntraNet/frontend/src/hooks/`: comportamiento React reutilizable, como confirmaciones e instalación de la PWA.
- `IntraNet/frontend/src/utils/`: formato de fechas, nombres, tokens, carga de archivos y esquemas de validación.
- `IntraNet/frontend/src/styles/`: estilos globales, tema, tipografías y componentes visuales.
- `IntraNet/frontend/src/config/` y `src/data/`: configuración y datos estáticos consumidos por la interfaz.

## Autenticación y permisos

El login público es `POST /auth/login`. Las rutas privadas usan `authenticateToken`; la mayoría también usa `requirePasswordChanged` para impedir que una contraseña inicial siga activa. Los roles válidos y las decisiones de autorización del servidor están centralizados en [`roles.js`](IntraNet/backend/src/utils/roles.js). Las restricciones del frontend solo controlan navegación y visibilidad: la autorización efectiva siempre corresponde al backend.

## Datos y recursos

Los datos de negocio principales viven en Supabase/PostgreSQL. Estos archivos auxiliares se manejan como datos y no admiten comentarios inline sin dejar de ser JSON válido:

| Archivo | Contenido/uso |
| --- | --- |
| `IntraNet/backend/src/data/activity_logs.json` | Registros locales de actividad para los flujos que usan el almacén JSON. |
| `IntraNet/backend/src/data/auth_locks.json` | Estado local de bloqueos de autenticación. |
| `IntraNet/backend/src/data/home_slider.json` | Datos históricos/locales del carrusel. |
| `IntraNet/backend/src/data/home_slider_meta.json` | Metadatos del carrusel y compatibilidad de importación. |
| `IntraNet/backend/src/data/sectores.json` | Datos de respaldo para sectores cuando se usa el almacén JSON. |
| `IntraNet/frontend/public/` | Imágenes, iconos, favicon, manifiesto PWA y mockup estático. Los archivos `.png` son recursos binarios, no código. |
| `package-lock.json` y los `package-lock.json` internos | Versiones resueltas por npm; son archivos generados y no admiten comentarios JSON. |
| `IntraNet/frontend/lighthouse-*.json` | Informes generados por Lighthouse, útiles para revisar mediciones del sitio. |

Los directorios `node_modules`, artefactos de build, cachés e informes generados no son código fuente mantenido y no deben editarse a mano.

### Configuración y archivos de soporte

| Archivo | Función |
| --- | --- |
| `IntraNet/backend/package.json` y `IntraNet/frontend/package.json` | Dependencias y comandos npm del servidor y de la aplicación web, respectivamente. |
| `IntraNet/backend/.env.example` | Plantilla de configuración privada del backend: Supabase, JWT, CORS, SMTP y destinatarios. Copiar a `.env` y completar localmente. |
| `IntraNet/frontend/.env.example` | Plantilla de variables públicas del navegador, incluida la URL de la API y la clave anon de Supabase. No colocar aquí credenciales privilegiadas. |
| `IntraNet/frontend/vite.config.ts` | Configura Vite, React, Tailwind y el plugin PWA, incluyendo caché y fallback de navegación. |
| `IntraNet/frontend/tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` | Configuración de TypeScript para la aplicación y las herramientas de build. |
| `IntraNet/frontend/.eslintrc.cjs` | Reglas de lint del frontend. |
| `IntraNet/frontend/index.html` | Plantilla HTML que carga la aplicación React. |
| `IntraNet/frontend/public/manifest.webmanifest` | Nombre, colores e iconos que el navegador usa para instalar la PWA. |
| `IntraNet/frontend/scripts/generate-pwa-icons.mjs` | Genera los iconos PWA a partir de los recursos del proyecto durante el build. |
| `IntraNet/frontend/README.md` | Notas específicas de Vite y del frontend. |
| `package.json`, `package-lock.json` en la raíz | Dependencias Expo/TypeScript del espacio raíz; no son los comandos de desarrollo de la intranet, que viven en las carpetas `IntraNet/backend` y `IntraNet/frontend`. |
| `tsconfig.json`, `tsconfig.tsbuildinfo` en la raíz | Configuración y caché incremental de TypeScript del espacio raíz. El `.tsbuildinfo` es generado. |
| `.gitignore`, `.gitattributes`, `.vscode/settings.json` | Exclusiones de Git, normalización de archivos y preferencias del editor. |
| `.expo/` | Estado local que usan las herramientas Expo; no contiene endpoints ni lógica de negocio de la intranet. |
| `expo-router-56.0.0.tgz` | Archivo comprimido de paquete npm conservado en el repositorio; es un artefacto binario y no admite comentarios inline. |

## Base de datos

- [`supabase/estructura.sql`](supabase/estructura.sql): estructura de referencia con tablas, relaciones, restricciones, índices y funciones SQL.
- [`supabase/migrations/20261104_password_recovery.sql`](supabase/migrations/20261104_password_recovery.sql): operaciones SQL para respaldar el flujo de recuperación de contraseña.
- [`IntraNet/backend/SCHEMA.md`](IntraNet/backend/SCHEMA.md): notas del esquema que usa el backend.

## Scripts disponibles

### Backend (`IntraNet/backend`)

| Comando | Acción |
| --- | --- |
| `npm run dev` | Inicia Express con reinicio automático usando nodemon. |
| `npm start` | Inicia Express para ejecución normal. |
| `npm test` | Ejecuta las pruebas de Node.js. |
| `npm run check:env` | Valida variables de entorno requeridas. |
| `npm run check:smtp` | Revisa la configuración de correo SMTP. |
| `npm run smoke` | Ejecuta un recorrido de comprobación de operaciones de empleado. |

Los scripts individuales están en `IntraNet/backend/scripts/`: `check-env.js` y `check-smtp.js` diagnostican configuración; `seed-default-users.js`, `seed-empleados-passwords.js` y `set-admin-password.js` preparan credenciales/datos; `smoke-employee.js` ejecuta el flujo de comprobación. `testEmail.js` envía un correo de prueba.

### Frontend (`IntraNet/frontend`)

| Comando | Acción |
| --- | --- |
| `npm run dev` | Inicia Vite para desarrollo local. |
| `npm run build` | Genera iconos PWA, comprueba TypeScript y crea el bundle de producción. |
| `npm run preview` | Sirve localmente el bundle compilado. |
| `npm run lint` | Ejecuta ESLint sobre el frontend. |
| `npm run pwa:icons` | Genera iconos PWA desde el script del proyecto. |

## Configuración local

Requisitos: Node.js, npm y acceso al proyecto Supabase configurado con el esquema correspondiente.

1. Instala dependencias del backend y prepara el entorno:

   ```sh
   cd IntraNet/backend
   npm install
   cp .env.example .env
   ```

   Completa las variables privadas de Supabase, `JWT_SECRET` y `CORS_ORIGINS`. No compartas ni subas `.env`.

2. Inicia la API en una terminal:

   ```sh
   npm run dev
   ```

3. En otra terminal, instala e inicia el frontend:

   ```sh
   cd IntraNet/frontend
   npm install
   ```

   Configura `.env.local` con `VITE_BACKEND_URL=http://localhost:4000` y ejecuta `npm run dev`.

4. Abre la URL que muestra Vite. Comprueba la API con `GET /health`.

## Documentación relacionada

- [Documentación técnica integral](DOCUMENTACION_TECNICA.md)
- [Requerimientos funcionales del frontend](IntraNet/frontend/REQUIREMENTS.md)
- [Esquema utilizado por el backend](IntraNet/backend/SCHEMA.md)
- [Sincronización de datos](IntraNet/backend/SYNC.md)
- [Recuperación de contraseña](IntraNet/backend/RECUPERACION.md)
