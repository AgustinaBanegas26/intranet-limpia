# Propuesta comercial — borrador

Documento editable. Los valores económicos quedan deliberadamente como `[COMPLETAR]`. El código evidencia integración con Vercel, Supabase y correo mediante Gmail/Nodemailer, pero no identifica el plan contratado ni precios vigentes.

## Alcance

Implementación y puesta en marcha de una intranet web para centralizar solicitudes internas, ausencias, comunicaciones y contenidos institucionales. El alcance funcional implementado y sus límites se detallan en [estado actual](estado-actual.md); la arquitectura está en [arquitectura](arquitectura.md).

## Entregables

- Aplicación web responsive con acceso por usuario, roles y perfiles.
- Módulos de solicitudes de viáticos, adelantos, rendiciones, ausencias y vacaciones.
- Gestión de empleados, sectores, reservas, novedades, eventos, políticas, manuales, beneficios y comunicación interna según funcionalidades presentes.
- API backend integrada con Supabase/PostgreSQL.
- Configuración de correo transaccional para las notificaciones soportadas.
- Documentación técnica del proyecto y guía de capturas: ver archivos de esta carpeta.
- Despliegue y configuración de producción: sujeto a completar accesos y valores de infraestructura.

## Cronograma estimado por etapas

Estimación referencial en semanas de trabajo; ajustar según disponibilidad de referentes, datos y pruebas de aceptación.

| Etapa | Duración estimada | Actividades |
|---|---:|---|
| Relevamiento y validación | 1 semana | Confirmación de circuitos, responsables, permisos y criterios de aceptación. |
| Preparación de infraestructura y datos | 1 semana | Supabase, variables privadas, correo, entorno y carga inicial. |
| Adaptación e integración funcional | 2–4 semanas | Ajustes priorizados, migraciones necesarias e integración de módulos. |
| Validación con usuarios | 1–2 semanas | Pruebas de aceptación, revisión de permisos, correcciones y capacitación. |
| Puesta en marcha | 1 semana | Deploy, verificación de operación, documentación de soporte y traspaso. |

El cronograma definitivo es `[COMPLETAR]` y depende del alcance final y la disponibilidad de usuarios clave.

## Supuestos

- La institución provee responsables funcionales por RRHH, administración, tesorería y sucursales.
- La institución entrega datos iniciales consistentes y autoriza su tratamiento para la intranet.
- Las cuentas de Vercel, Supabase y correo se contratan y mantienen a nombre de la institución, salvo acuerdo distinto.
- Los circuitos y reglas de aprobación se validan antes de cerrar la etapa funcional.
- La estimación no incluye integración con sistemas externos que no estén descritos en el repositorio; toda ampliación se cotiza aparte.
- Las tarifas actuales, facturación, impuestos, moneda y tipo de cambio quedan `[COMPLETAR]`.

## Hosting y servicios

| Servicio | Uso observado | Plan realmente contratado/operativo | Costo |
|---|---|---|---:|
| Vercel | El repositorio incluye handlers serverless y menciona endpoints compatibles. | **No verificado** en el repositorio. No hay archivo `vercel.json` ni evidencia de cuenta/despliegue activo. | `[COMPLETAR]` |
| Supabase | PostgreSQL accedido con `@supabase/supabase-js`; el backend requiere URL y clave de servicio. | **No verificado**. El proyecto no especifica plan ni tamaño contratado. | `[COMPLETAR]` |
| Correo | Nodemailer envía las notificaciones de solicitudes al destino configurado en `EMAIL_RECIBIDOS`; SMTP se usa para recuperación de contraseña. | Gmail/SMTP está previsto por configuración; cuenta y modalidad de servicio **No verificado**. | `[COMPLETAR]` |
| Dominio | No se encuentra un dominio productivo configurado en el código revisado. | **No verificado**. | `[COMPLETAR]` |

No se asignan precios de lista porque los planes utilizados realmente no pueden confirmarse en el repositorio. Completar con cotizaciones y condiciones vigentes al momento de contratar.

## Esfuerzo estimado de desarrollo

Estimación para planificación de evolución, no constituye medición de horas ya ejecutadas.

| Módulo/actividad | Horas estimadas |
|---|---:|
| Relevamiento, circuitos y permisos | 16–24 h |
| Autenticación, usuarios y perfiles | 28–40 h |
| Viáticos y rendiciones | 36–52 h |
| Adelantos, ausencias y vacaciones | 24–36 h |
| Reservas de vehículos y alojamiento | 24–40 h |
| Novedades, eventos y comunicación | 32–48 h |
| Paneles, calendario y reportes | 20–32 h |
| Infraestructura, deploy y observabilidad | 16–24 h |
| Pruebas de aceptación, capacitación y documentación | 24–36 h |
| **Total estimado** | **220–332 h** |

## Mantenimiento y soporte

- Mantenimiento correctivo y actualizaciones: `[COMPLETAR]` por mes o bolsa de horas.
- Soporte funcional/técnico: `[COMPLETAR]` en días y horarios `[COMPLETAR]`.
- Tiempo objetivo de primera respuesta: `[COMPLETAR]`.
- Cambios evolutivos fuera del alcance: cotización y aprobación previa `[COMPLETAR]`.
- Backup, monitoreo y gestión de incidentes: responsable, frecuencia y retención `[COMPLETAR]`.

## Condiciones

- Precio total del proyecto: `[COMPLETAR]`.
- Moneda, impuestos y vigencia de la oferta: `[COMPLETAR]`.
- Forma y calendario de pago: `[COMPLETAR]`.
- Inicio estimado: `[COMPLETAR]`, una vez disponibles accesos y referentes.
- Aceptación: criterios, responsables y plazo de revisión `[COMPLETAR]`.
- Propiedad intelectual, custodia de datos y credenciales: `[COMPLETAR]` según acuerdo entre las partes.
- Servicios de terceros y sus costos recurrentes se cotizan por separado y dependen de la cuenta titular.
