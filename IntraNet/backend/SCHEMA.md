# Esquema Supabase — Portal interno

Fuente de verdad: schema en Supabase (jun 2026).  
Migración pendiente recomendada: `migrations/003_empleados_role.sql` (columna `role`).

---

## Resumen: BD vs código

| Tabla                               | Columnas en Supabase                                           | Backend                          | Frontend                        |
| ----------------------------------- | -------------------------------------------------------------- | -------------------------------- | ------------------------------- |
| `empleados`                         | Completo (sin `role` aún)                                      | Login, perfil, listado, alta     | Perfil, empleados admin         |
| `novedades`                         | Completo + encuesta/archivo                                    | **Conectado**                    | Feed + composer admin           |
| `novedades_likes`                   | PK compuesta                                                   | **Conectado**                    | Likes                           |
| `novedades_encuesta_votos`          | Sin UNIQUE en schema actual                                    | **Conectado**                    | Encuesta                        |
| `novedades_comentarios`             | Existe                                                         | No expuesto                      | No                              |
| `notificaciones`                    | Completo                                                       | Crear al publicar + GET          | Sin UI badge                    |
| `ausencias`                         | Completo                                                       | **No**                           | Mock empleado + admin           |
| `vacaciones_saldo`                  | Por empleado/año                                               | **No**                           | Mock (no hay tabla solicitudes) |
| `eventos`                           | `titulo`, `descripcion`, `fecha_inicio`, `lugar`, `creado_por` | **No**                           | Mock distinto                   |
| `beneficios`                        | `nombre`, `descripcion`, `imagen_url`                          | **No**                           | Mock (`title`, `provider`)      |
| `politicas`                         | `titulo`, `categoria`, `archivo_url`, `version`                | **No**                           | Mock                            |
| `politicas_lecturas`                | Existe                                                         | **No**                           | No                              |
| `sugerencias` + `sugerencias_votos` | Completo                                                       | **No**                           | Mock                            |
| `viaticos`                          | Completo                                                       | **Conectado** vía `/solicitudes` | Wizard empleado                 |
| `reservas_hotel`                    | Completo                                                       | **Conectado** vía `/solicitudes` | Wizard empleado                 |
| `reservas_vehiculos` + `vehiculos`  | Completo                                                       | **Conectado** vía `/solicitudes` | Wizard empleado                 |
| `recibos_sueldo`                    | Completo                                                       | **No**                           | Link ON Balance externo         |

---

## `empleados`

| Columna                                                   | Tipo        | Uso en app                                                       |
| --------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| `id`                                                      | bigint PK   | JWT `sub`, FKs                                                   |
| `auth_user_id`                                            | uuid        | Futuro Supabase Auth                                             |
| `legajo`                                                  | text UNIQUE | Alta admin                                                       |
| `nombre`, `apellido`                                      | text        | Perfil, autor novedades                                          |
| `fecha_nacimiento`, `fecha_ingreso`                       | date        | Cumpleaños, aniversarios                                         |
| `email_corporativo`                                       | text UNIQUE | Login                                                            |
| `email_personal`, `telefono`, `domicilio`                 | text        | Perfil                                                           |
| `foto_url`                                                | text        | Avatar                                                           |
| `sucursal`, `area`, `cargo`                               | text        | Perfil (RRHH)                                                    |
| `es_director`                                             | boolean     | Fallback rol → `director` si no hay `role`                       |
| `role`                                                    | text        | **Migración 003:** `admin` \| `rrhh` \| `director` \| `empleado` |
| `activo`                                                  | boolean     | Login, notificaciones                                            |
| `password_hash`, `must_change_password`                   |             | Auth                                                             |
| `work_mode`, `estado_civil`, `documento`, `hijos`, `cuil` |             | Perfil                                                           |

**Problema actual:** Gisela tiene `es_director = true` y sin `role` → entra como **director** → ve menú **empleado**, no panel admin.

---

## `novedades` ✅ alineada con el código

| Columna                                  | Backend      | Frontend                            |
| ---------------------------------------- | ------------ | ----------------------------------- |
| `titulo`, `contenido`                    | create/read  | Composer, cards                     |
| `imagen_url`                             | create/read  | Galería                             |
| `archivo_url`, `archivo_nombre`          | create/read  | Adjunto descargable                 |
| `encuesta_pregunta`, `encuesta_opciones` | create/read  | Form + `NewsPoll`                   |
| `destacado_admin_hasta`                  | create/read  | Strip “Tus publicaciones recientes” |
| `publicado_por`                          | FK empleados | Autor                               |
| `importante`, `activo`, `created_at`     | Sí           | Badge + fecha                       |

---

## `ausencias` (pendiente implementar)

| Columna                      | Notas                                               |
| ---------------------------- | --------------------------------------------------- |
| `empleado_id`                | Quién solicita                                      |
| `tipo`                       | Enfermedad, vacaciones, etc.                        |
| `fecha_desde`, `fecha_hasta` | Rango                                               |
| `motivo`                     | Texto libre                                         |
| `estado`                     | `pendiente` / aprobado (también `aprobada` boolean) |

**Nota:** No hay tabla `vacaciones_solicitudes`. Las vacaciones pueden modelarse como `ausencias` con `tipo = 'vacaciones'` o ampliar schema.

---

## `vacaciones_saldo`

| Columna          | Notas          |
| ---------------- | -------------- |
| `empleado_id`    | PK             |
| `anio`           | Año calendario |
| `dias_asignados` | Default 14     |
| `dias_usados`    | Acumulado      |

El frontend mock usa 30 días — **no coincide** con default 14 en DB.

---

## `eventos` (pendiente — mapeo UI → DB)

| Supabase                    | Mock frontend actual                          |
| --------------------------- | --------------------------------------------- |
| `titulo`                    | `title`                                       |
| `descripcion`               | `description`                                 |
| `fecha_inicio`, `fecha_fin` | `date`, `time`                                |
| `lugar`                     | `location`                                    |
| `creado_por`                | —                                             |
| —                           | `category`, `maxAttendees`, imagen (no en DB) |

---

## `beneficios` (pendiente — mapeo UI → DB)

| Supabase      | Mock frontend actual                          |
| ------------- | --------------------------------------------- |
| `nombre`      | `title`                                       |
| `descripcion` | `description`                                 |
| `imagen_url`  | —                                             |
| `activo`      | —                                             |
| —             | `provider`, `discount`, `category` (no en DB) |

**Sugerencia:** agregar columnas `marca`, `categoria`, `descuento`, `link_cta` o guardar en JSON si no querés migrar.

---

## `politicas`

| Columna                            | Uso                           |
| ---------------------------------- | ----------------------------- |
| `titulo`, `categoria`, `version`   | Listado                       |
| `archivo_url`                      | PDF                           |
| `paginas`, `obligatoria`, `activo` | Metadata                      |
| `politicas_lecturas`               | Tracking lectura por empleado |

---

## `sugerencias` + `sugerencias_votos`

| Supabase                 | Mock frontend              |
| ------------------------ | -------------------------- |
| `titulo` + `descripcion` | Un solo campo `text`       |
| `categoria`, `estado`    | `category`, sin moderación |
| `sugerencias_votos`      | `likes` local              |

---

## `viaticos` / `reservas_hotel` / `reservas_vehiculos`

Tablas listas. El wizard frontend (`NewRequestPage`) debería ramificar:

- Viáticos → `viaticos`
- Hotel → `reservas_hotel`
- Auto → `reservas_vehiculos` (+ catálogo `vehiculos`)

---

## Endpoints implementados hoy

```
POST   /auth/login
PUT    /auth/change-password
GET    /profile
PUT    /profile
GET    /empleados
POST   /empleados
GET    /novedades
POST   /novedades
GET    /novedades/mias
POST   /novedades/:id/like
POST   /novedades/:id/encuesta/vote
DELETE /novedades/:id
GET    /birthdays
GET    /notificaciones
PUT    /notificaciones/:id/leer
GET    /solicitudes
POST   /solicitudes
PUT    /solicitudes/:id/approve
PUT    /solicitudes/:id/reject
```

---

## Próximos endpoints sugeridos (orden)

1. `GET/POST /ausencias` + `PATCH /ausencias/:id/estado` (admin)
2. `GET /vacaciones/saldo` + usar `vacaciones_saldo`
3. `GET/POST/PUT/DELETE /eventos`
4. `GET/POST/PUT/DELETE /beneficios`
5. `GET /politicas` + `POST /politicas/:id/leer`
6. `GET/POST /sugerencias` + vote + status admin
7. `GET/POST /viaticos`, `/reservas/hotel`, `/reservas/vehiculos`
