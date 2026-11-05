# Estado actual

Los estados describen evidencia del código presente, no una certificación de operación productiva.

| Funcionalidad | Estado | Evidencia resumida |
|---|---|---|
| Inicio de sesión con bcrypt y JWT | Completo | Endpoint `/auth/login`, middleware JWT y cuenta de empleado consultada en Supabase. |
| Recuperación/cambio de contraseña | Completo | Solicitud, verificación y reset con migración SQL, rate limit y correo SMTP; hay pantalla de recuperación. El uso real de SMTP queda sujeto a configuración. |
| Roles y autorización | Parcial | Existen cuatro roles, pero las funciones admin solo habilitan al rol `admin`; `rrhh` y `director` no tienen capacidades diferenciadas en middleware. |
| Gestión de empleados y sectores | Completo | Rutas CRUD protegidas para admin y servicios Supabase. |
| Solicitudes generales y viáticos | Completo | Formularios, listado administrativo, estados y notificaciones. La calidad operativa depende de la base/configuración externa. |
| Rendición de gastos | Completo | Gastos, totales, comprobantes referenciados, envío, aprobación y devolución. No hay suite de pruebas de negocio. |
| Adelantos | Completo | Alta y resolución aprobada/rechazada con servicios y pantallas. |
| Ausencias y vacaciones | Parcial | Creación y gestión de ausencias/vacaciones y consulta de saldo. Solicitudes se representan en `ausencias`; no se observa actualización del saldo dentro del servicio de vacaciones. |
| Reservas de vehículos y alojamiento | Parcial | Tablas y pantalla genérica de solicitudes/reservas; **No verificado** si hay asignación operativa y prevención completa de solapamientos. |
| Muro de novedades y encuestas | Completo | Publicación admin, lectura, reacciones/votos y alcance por sucursal en servicios. |
| Mensajes, notificaciones y políticas | Completo | Rutas/servicios de lectura y gestión con base de datos. |
| Calendario | Parcial | Pantalla administrativa y servicio de calendario; alcance de edición/sincronización externa no verificado. |
| Archivos y comprobantes | Parcial | Frontend lee archivos como Data URL y persiste referencias/campos URL. **No verificado** un bucket o repositorio durable de archivos. |
| Deploy Vercel | Parcial | Hay handler serverless y endpoint de diagnóstico; no hay `vercel.json` en el repositorio revisado. |
| Pruebas automatizadas de negocio | Pendiente | No se hallaron pruebas para los servicios/módulos. El único test comprueba endpoint de diagnóstico. |

## Deuda técnica y límites

- Bloqueos por intentos de login y logs de actividad usan JSON local (`backend/src/data`) y se omiten cuando `VERCEL=1`. En almacenamiento serverless, la persistencia y compartición entre instancias no están disponibles para esos mecanismos.
- El cliente guarda JWT y sesión en `localStorage`; la sesión persiste en el navegador.
- Los roles `rrhh` y `director` están admitidos en datos, pero las capacidades especiales no están implementadas en las funciones de autorización examinadas.
- Configuración de proveedor/bucket de archivos no aparece confirmada; algunos datos usan URLs y el frontend codifica archivos en Data URL.
- No se detectó suite automatizada para permisos, transiciones y cálculos de negocio.
- Coexisten tablas especializadas y solicitudes genéricas, con normalización de estados para compatibilidad; el modelo puede requerir consolidación documentada.
- No se incluye configuración versionada que confirme los planes, el proyecto Vercel/Supabase activo ni el proveedor de correo productivo.
