# Pruebas automatizadas

## Prueba encontrada

| Archivo | Ejecución | Regla cubierta | Resultado observado |
|---|---|---|---|
| `IntraNet/backend/api/test.js` | Desde `IntraNet/backend`: `node --test` (o `npm test`) | Comprueba el handler de prueba de Vercel: responde HTTP 200 con JSON `ok: true` y mensaje de funcionamiento. No cubre reglas de negocio de la intranet. | `node --test`: 1 test, 1 aprobado, 0 fallidos, 0 omitidos. Duración reportada: 126 ms. |

El script `test` del `backend/package.json` ejecuta `node --test`. En este entorno `npm test` no pudo iniciar porque Windows devolvió “Acceso denegado” al proceso `npm`; se ejecutó directamente `node --test` y el resultado está arriba. El frontend no declara un script de tests; declara `build`, `lint`, `dev`, `preview` y generación de íconos.

## Reglas importantes sin pruebas automatizadas encontradas

- Autenticación, JWT, bloqueo de intentos y cambio obligatorio de contraseña.
- Recuperación de contraseña, caducidad, límite de intentos y consumo de tokens.
- Permisos por rol y restricciones por propiedad de registros.
- Creación, aprobación y rechazo de viáticos, adelantos, vacaciones y ausencias.
- Habilitación, edición, envío, aprobación y devolución de rendiciones.
- Cálculos de importes, saldos y validación de adjuntos.
- Destinatarios y fallos de correo con Nodemailer.
- Filtrado de novedades/eventos por sucursal y operaciones de mensajería.
- Integración real con Supabase y despliegue en Vercel.

No se encontraron suites Node.js Test Runner en los servicios; el único caso detectado es el handler de prueba de despliegue indicado arriba. Esta conclusión se refiere a los archivos revisados del repositorio y puede cambiar si existen pruebas externas no incluidas.
