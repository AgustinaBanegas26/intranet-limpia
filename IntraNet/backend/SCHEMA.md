# Esquema Supabase

## Fuente y alcance

[`../../supabase/estructura.sql`](../../supabase/estructura.sql) es el esquema
base versionado. [`../../supabase/migrations/`](../../supabase/migrations/)
contiene las migraciones incrementales disponibles en este repositorio. Estos
archivos documentan la estructura esperada, pero no permiten confirmar qué
migraciones ya se aplicaron en una instancia Supabase remota. Comprobar el
proyecto y su esquema antes de desplegar.

La única migración incluida actualmente es
`20261104_password_recovery.sql`. Añade el almacenamiento de solicitudes de
recuperación, `empleados.credential_version` y funciones SQL para cambiar la
contraseña, aplicar límites, verificar códigos y revocar credenciales
anteriores.

## Tablas de referencia y migración

El SQL base y la migración de recuperación definen estas tablas:

| Dominio | Tablas |
| --- | --- |
| Empleados y organización | `empleados`, `sectores` |
| Autenticación | `password_recovery_requests` (migración), credenciales en `empleados` |
| Novedades | `novedades`, `novedades_likes`, `novedades_encuesta_votos`, `novedades_comentarios` |
| Solicitudes y reservas | `solicitudes`, `viaticos`, `reservas_hotel`, `reservas_vehiculos`, `vehiculos`, `adelantos`, `ausencias`, `vacaciones_saldo` |
| Rendiciones | `viaticos_rendiciones`, `viaticos_rendiciones_gastos` |
| Contenido | `beneficios`, `eventos`, `eventos_asistentes`, `home_slider`, `manuales`, `politicas`, `politicas_lecturas` |
| Comunicación | `notificaciones`, `mensajes` |
| Otros | `recibos_sueldo`, `sugerencias`, `sugerencias_votos`, `technical_supply_requests` |

Para ver los endpoints conectados a los módulos, consulta
[`SYNC.md`](./SYNC.md). Los servicios backend que acceden a Supabase están en
`src/services/`; los archivos de esquema y servicios deben revisarse juntos al
cambiar una tabla o una operación.

## Empleados, roles y sesión

La tabla `empleados` proporciona los datos del perfil y las credenciales
utilizadas por el login del portal. El código reconoce los roles `empleado`,
`rrhh`, `director` y `admin`. La resolución del rol y los permisos del servidor
se implementan en `src/utils/roles.js`.

El cambio de contraseña voluntario y el flujo de recuperación se ejecutan en
el backend. La migración de recuperación incrementa `credential_version` al
cambiar la clave; el middleware compara esa versión con la incluida en el JWT
para rechazar tokens anteriores.

## Novedades y encuestas

El backend consulta `novedades` y sus tablas auxiliares de likes y votos. Las
operaciones de lectura/escritura se implementan en
`src/services/novedades.service.js`; las rutas REST están en `src/index.js`.
La tabla `novedades_comentarios` forma parte del esquema de referencia, pero
no se debe asumir que exista una API de comentarios por el solo hecho de que la
tabla esté definida.

## Persistencia y compatibilidad

Supabase contiene los datos de negocio. El backend también conserva algunos
datos operativos y metadatos de importación en JSON bajo `src/data/`. El
servicio del slider puede importar el JSON histórico a la tabla `home_slider`;
la marca de importación se guarda en `home_slider_meta.json`.

No usar valores de prueba o del frontend como sustituto del esquema remoto. Si
una columna, tabla o RPC no existe en el entorno configurado, la llamada de
backend puede fallar aunque el frontend compile correctamente.

## Aplicar cambios

1. Revisar el SQL y confirmar que corresponde al proyecto Supabase objetivo.
2. Respaldar la base antes de aplicar cambios estructurales.
3. Ejecutar sólo las migraciones pendientes y guardar su resultado.
4. Verificar tablas, columnas, funciones y permisos con una cuenta de servicio
   adecuada.
5. Probar los endpoints afectados y actualizar este documento y `SYNC.md`.

Nunca incluir claves `service_role`, contraseñas ni tokens en el frontend, en
este documento o en los archivos SQL versionados.
