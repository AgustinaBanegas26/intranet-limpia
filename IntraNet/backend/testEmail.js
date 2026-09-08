const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const { sendTestEmail } = require('./src/services/emailService')
//
async function main() {
  try {
    const result = await sendTestEmail()
    console.log('Resultado del envío de prueba:', result)
  } catch (error) {
    console.error('Error en prueba de email:', error)
    process.exit(1)
  }
}

main()
