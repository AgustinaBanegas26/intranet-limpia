// Script manual de diagnóstico: envía un correo de prueba para comprobar la configuración SMTP.
const path = require('path')
// Carga las variables privadas desde el .env del backend para que el servicio de correo pueda conectarse.
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

// Importa la operación de envío reutilizada por el backend; este script no implementa SMTP por su cuenta.
const { sendTestEmail } = require('./src/services/emailService')

// Función asíncrona principal: espera el resultado del envío y centraliza el manejo de errores.
async function main() {
  try {
    // await espera la promesa de envío antes de imprimir su resultado.
    const result = await sendTestEmail()
    console.log('Resultado del envío de prueba:', result)
  } catch (error) {
    // Un error se informa en consola y el código distinto de cero indica que el diagnóstico falló.
    console.error('Error en prueba de email:', error)
    process.exit(1)
  }
}

// Inicia el diagnóstico cuando se ejecuta este archivo con Node.js.
main()
