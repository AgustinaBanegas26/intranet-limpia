# Requerimientos — Web privada Grupo Núcleo

Documento fuente: `Requerimientos para el desarrollo de la Web privada GRUPO NÚCLEO.pdf`

## Dos aplicaciones en el mismo frontend

| Área | Usuario | Carpeta | Descripción |
|------|---------|---------|-------------|
| **Panel administrador** | Gisela (admin) | `src/app/` | Gestión: empleados CRUD, aprobar solicitudes, calendario reservas, ausencias, publicar novedades |
| **Intranet empleados** | Todos los empleados | `src/intranet/` | Consulta y solicitudes: vacaciones, novedades (like), reservas auto/hotel, perfil, etc. |

## Módulos intranet (empleados)

Según el PDF — dashboard / web común:

- Vacaciones
- Novedades (solo like, sin comentarios en v1)
- Viáticos
- Auto y hotel (calendario de reservas + formulario de solicitud)
- Cambio de domicilio / perfil
- Cumpleaños y antigüedad
- Ausencias
- Eventos (agenda)
- On Balanceada (recibos de sueldo)
- Beneficios
- Política de empresa
- Sugerencias

## Módulos panel admin (Gisela)

- Lista mínima de empleados + modal **View** (detalle amplio, edición)
- Árbol jerárquico por cargo / director
- Alta / baja / edición empleados (formulario → BD)
- Calendario vehículos reservados + aprobación solicitudes
- Calendario ausencias
- Gestión de novedades, eventos, políticas, beneficios
- Creación de cuentas, reset contraseña, roles

## Autenticación (objetivo backend)

1. Admin crea cuenta → contraseña temporal (hash Argon2/bcrypt)
2. Primer login: email corporativo + temporal → obligatorio cambiar contraseña (`must_change_password`)
3. Admin no ve contraseñas; puede resetear / suspender
4. OAuth Google opcional (avatar, login rápido)
5. Solo empleados acceden a la intranet (red / VPN / dominio según defina Paola)

## Colorimetría

- Principal: blanco
- Secundario: `#CC2627` (flag-red)
- Complementario: `#5C5C5C` (charcoal), `#F1F1F1` (platinum)

## Estado de implementación

- [x] Panel admin — UI Figma (datos mock)
- [x] Intranet empleados — estructura de rutas y páginas (datos mock)
- [ ] API Express + Prisma + PostgreSQL
- [ ] Login email/contraseña + cambio obligatorio
- [ ] Conexión formularios y calendarios a BD
