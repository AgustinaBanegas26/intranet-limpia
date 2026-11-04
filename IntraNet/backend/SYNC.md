# Integración entre frontend, backend y Supabase

Este documento resume las conexiones presentes en el código. Los endpoints se
declaran en `src/index.js`, las consultas viven en `src/services/` y las
pantallas/servicios del navegador están en `../frontend/src/`. La presencia de
un servicio en el repositorio no confirma que la tabla o migración ya exista
en el proyecto Supabase desplegado.

## Módulos conectados

| Dominio | API | Frontend | Persistencia principal |
| --- | --- | --- | --- |
| Autenticación | `/auth/login`, `/auth/change-password`, `/auth/password-recovery/*` | `services/auth.ts`, `services/passwordRecovery.ts` | `empleados`; tabla de recuperación creada por migración |
| Empleados y perfil | `/empleados`, `/empleados/:id/*`, `/profile`, `/sectores` | `services/employees.ts`, `services/profile.ts`, `services/sectores.ts` | Empleados y sectores |
| Novedades | `/novedades/*` | `services/news.ts`, pantallas de novedades e inicio | Novedades, likes y votos |
| Notificaciones | `/notificaciones/*` | `services/notifications.ts`, bandeja | Notificaciones |
| Solicitudes y reservas | `/solicitudes/*`, `/viaticos` | `services/requests.ts`, `services/calendar.ts` | Solicitudes, viáticos y reservas |
| Rendiciones | `/rendiciones/*` | `services/rendiciones.ts` | Rendiciones y gastos |
| Adelantos | `/adelantos/*` | `services/adelantos.ts` | Adelantos |
| Ausencias y vacaciones | `/ausencias/*`, `/vacaciones/*` | `services/absences.ts`, `services/vacations.ts` | Ausencias y saldos/solicitudes |
| Insumos técnicos | `/insumos-tecnicos/*` | `services/technicalSupplies.ts` | Solicitudes y fichas de insumos |
| Catálogos y contenido | `/beneficios/*`, `/eventos/*`, `/politicas/*`, `/manuales/*`, `/sugerencias/*`, `/slider/*` | Servicios y páginas del mismo dominio | Tablas de cada catálogo; el slider también importa JSON histórico |
| Mensajes y celebraciones | `/mensajes/*`, `/birthdays` | `services/messages.ts`, `services/celebraciones.ts` | Mensajes y datos de empleados |

Las rutas `GET /health` sirven para comprobar la API y su acceso a Supabase.
El estado de cada operación y sus permisos se valida en el backend, aunque el
frontend también aplique restricciones de navegación.

## Esquema y migraciones

- `../../supabase/estructura.sql` contiene el esquema base de referencia.
- `../../supabase/migrations/20261104_password_recovery.sql` implementa la
  recuperación de contraseña y la versión de credenciales para revocar JWT.
- `SCHEMA.md` contiene contexto adicional, incluidas diferencias históricas.

Antes de desplegar, comparar estos archivos con el esquema remoto, respaldar la
base y aplicar únicamente las migraciones pendientes en el proyecto correcto.
No asumir que un archivo del repositorio ya fue aplicado en Supabase.

## Persistencia auxiliar

El backend conserva algunos datos operativos en archivos JSON dentro de
`src/data/`: registros de actividad, bloqueos de acceso y metadatos de
importación del slider. En producción, confirmar que esos archivos tengan un
volumen persistente y permisos adecuados. No usar ese almacenamiento como
sustituto de las tablas de negocio.

## Roles

Los roles válidos son `empleado`, `rrhh`, `director` y `admin`. Las reglas de
autorización del servidor están en `src/utils/roles.js`; el frontend replica
algunas comprobaciones para ocultar o redirigir rutas, pero el backend sigue
siendo la autoridad para cada operación.
