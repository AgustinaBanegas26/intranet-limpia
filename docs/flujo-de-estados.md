# Flujo de estados

Los diagramas reflejan las transiciones implementadas por servicios y rutas. En solicitudes generales, `admin` es el único rol backend habilitado para resolverlas; el usuario autenticado no administrador las crea. Las transiciones no descritas como acción de usuario no se presuponen.

## Viáticos

```mermaid
stateDiagram-v2
  [*] --> Pendiente: Empleado crea solicitud
  Pendiente --> Aprobada: Admin aprueba
  Pendiente --> Rechazada: Admin rechaza
  Aprobada --> RendicionHabilitada: Servicio habilita al finalizar viaje
```

La solicitud de viático usa `viaticos.estado`. Al aprobarse y cumplirse la condición de finalización, el servicio sincroniza/crea una rendición. No se confirma una transición automática de viático a estado `enviada`.

## Adelantos

```mermaid
stateDiagram-v2
  [*] --> Pendiente: Empleado crea solicitud
  Pendiente --> Aprobada: Admin aprueba
  Pendiente --> Rechazada: Admin rechaza
```

El backend acepta al resolver `aprobada` o `rechazada`; el servicio no permite resolver de nuevo como `pendiente`.

## Vacaciones

```mermaid
stateDiagram-v2
  [*] --> Pendiente: Empleado solicita vacaciones
  Pendiente --> Aprobada: Admin aprueba ausencia tipo vacaciones
  Pendiente --> Rechazada: Admin rechaza ausencia tipo vacaciones
  Pendiente --> Pendiente: Empleado edita o elimina solicitud pendiente
```

Vacaciones no tiene tabla de solicitudes separada: se persiste en `ausencias` con tipo `Vacaciones`/`vacacion`. Al aprobar una ausencia, `ausencias.service.js` actualiza `vacaciones_saldo`. Si no existe registro previo, el servicio crea uno con el valor asignado por defecto.

## Rendiciones

```mermaid
stateDiagram-v2
  [*] --> Pendiente: Sistema habilita tras viático aprobado y finalizado
  Pendiente --> Enviada: Empleado envía rendición
  Enviada --> Aprobada: Admin aprueba
  Enviada --> Devuelta: Admin devuelve con motivo
  Devuelta --> Enviada: Empleado corrige y reenvía
```

Los endpoints son `PUT /rendiciones/:id/enviar`, `/aprobar` y `/devolver`. El rechazo no aparece como estado final de rendición; el servicio traduce la decisión no aprobatoria a `devuelta`. El permiso de edición/envío respeta la propiedad de la rendición y el rol admin. La transición de reenvío se refleja en el servicio; **No verificado:** si todas las condiciones de negocio requeridas para cada tipo de gasto coinciden con una política institucional aprobada.
