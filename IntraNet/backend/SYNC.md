# Sincronización Backend ↔ Supabase ↔ Frontend

## Conectado

| Módulo | Tabla(s) | Endpoints | Frontend !s
|--------|----------|-----------|----------
| Empleados / perfil | `empleados` | `GET/PUT /profile`, `GET/POST /empleados` | Perfil, admin empleados |
| Novedades | `novedades`, `novedades_likes`, `novedades_encuesta_votos`* | Ver `SCHEMA.md` | `/novedades`, home feed |
| Notificaciones | `notificaciones` | `GET /notificaciones`, `PUT /notificaciones/:id/leer` | Pendiente UI badge |
| Cumpleaños | `empleados` | `GET /birthdays` | Home, `/cumpleanos` |
| Auth | `empleados` | `POST /auth/login`, `PUT /auth/change-password` | Login |
| Solicitudes | `viaticos`, `reservas_hotel`, `reservas_vehiculos` | `GET/POST /solicitudes`, approve/reject | `/solicitar` empleado, `/solicitudes` admin |

\* Tabla `novedades_encuesta_votos` y columnas extra requieren `migrations/002_novedades_extend.sql`.

## Migraciones en Supabase

| Archivo | Estado | Qué hace |
|---------|--------|----------|
| `002_novedades_extend.sql` | ✅ Ya aplicado en tu schema | archivo, encuesta, destacado_admin |
| `003_empleados_role.sql` | ✅ Aplicado | Columna `role` + Gisela = `admin` |
| Solicitudes Fase 1 | ✅ | Usa tablas `viaticos`, `reservas_hotel`, `reservas_vehiculos` |

Sin `003`: Gisela sigue como `director` (por `es_director`) y ve menú empleado.

Ver detalle completo en `SCHEMA.md`.

## Pendiente de endpoints

Ver listado completo en `SCHEMA.md` (eventos, beneficios, políticas, etc.).

## Reglas — novedades

- Publican admin y director (`canPublishNovedades`).
- Al publicar → notificación en `notificaciones` para cada empleado activo.
- Empleados: leer, like, votar encuesta.
- Strip admin: filtra por `destacado_admin_hasta` o últimos 7 días.
