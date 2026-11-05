# Riesgos y limitaciones

## Problemas que aborda la propuesta

| Problema | Aporte implementado | Riesgos y limitaciones observados |
|---|---|---|
| Viáticos y rendiciones | Solicitudes, seguimiento de estados, gastos y referencia a comprobantes, con revisión administrativa. | No se encontraron pruebas automatizadas de importes/transiciones. Las referencias a comprobantes no prueban por sí solas almacenamiento durable, respaldo ni control documental. El cumplimiento de políticas contables y fiscales está **No verificado**. |
| Vehículos y alojamiento | El esquema contempla reservas de unidades y hoteles, con fechas, estado y datos de solicitud. | En el código no se confirma prevención de reservas superpuestas, integración con proveedores, disponibilidad en tiempo real ni circuito completo de asignación. Esos puntos quedan **No verificado**. |
| Ausencias y vacaciones | Formularios y aprobaciones de ausencias, junto con consulta de saldo anual. | Vacaciones comparte la tabla `ausencias`; el servicio descuenta días del saldo al aprobar y usa 14 días como asignación predeterminada si no hay saldo existente. Reglas laborales, antigüedad, feriados y excepciones quedan **No verificado**. |
| Comunicación entre sucursales | Muro de novedades segmentable, eventos, mensajería, notificaciones y alcance por sucursal. | La segmentación depende de datos de sucursal coherentes; no hay pruebas automatizadas de visibilidad por sucursal. No se verifica entrega/retención del correo ni métricas de lectura más allá de las funciones disponibles. |

## Limitaciones generales

- El bloqueo de login y el log de actividad usan JSON local en desarrollo; ambos se desactivan en Vercel. No constituyen una bitácora distribuida durable.
- El token se guarda en `localStorage`, con exposición al contexto JavaScript del navegador.
- La API utiliza `SUPABASE_SERVICE_KEY`; es una credencial privilegiada del backend y su protección depende de mantenerla solo en variables privadas del servidor.
- Adjuntos se transforman a Data URL en cliente y se guardan como referencias/campos en registros. **No verificado** un sistema de almacenamiento de objetos, políticas de acceso, antivirus, retención o respaldo.
- Existe solo una prueba automatizada de diagnóstico; la cobertura de reglas críticas es insuficiente para afirmar ausencia de regresiones.
- No se identifican planes contratados ni costos actuales de Vercel, Supabase o correo en el repositorio.
- La disponibilidad, backups, monitoreo, recuperación ante desastres y tiempos de respuesta de proveedores quedan sujetos a la cuenta y configuración de despliegue, **No verificado** en código.

Para el estado funcional módulo por módulo, consultar [estado actual](estado-actual.md). Para infraestructura propuesta y rubros editables, consultar [propuesta comercial](propuesta-comercial.md).
