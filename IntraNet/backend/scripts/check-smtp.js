// Comprueba conexión y autenticación SMTP sin enviar correo ni mostrar secretos.
// Ejecutar desde IntraNet/backend con `npm run check:smtp`.
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') })

const { verifyRecoveryEmailTransport } = require('../src/services/recoveryEmailTransport')

async function main() {
  try {
    await verifyRecoveryEmailTransport()
    console.log('[check-smtp] Conexión SMTP y autenticación correctas; no se envió correo.')
  } catch (error) {
    if (error?.code === 'email_not_configured') {
      console.error(`[check-smtp] Faltan variables SMTP válidas: ${(error.missingVariables || []).join(', ')}`)
    } else {
      console.error(`[check-smtp] Falló la conexión SMTP (${error?.code || error?.name || 'smtp_error'}). No se envió correo.`)
    }
    process.exitCode = 1
  }
}

main()
