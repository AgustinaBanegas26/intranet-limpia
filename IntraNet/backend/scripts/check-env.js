//este archivo chequea que las variables de entorno estén correctamente configuradas, 
// y si no lo están, termina el proceso con un error.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { validateEnv } = require('../src/config/validateEnv')

const result = validateEnv({ exitOnError: true })
console.log('[check-env] Configuration OK')
console.log(`[check-env] NODE_ENV=${process.env.NODE_ENV || 'development'}`)
if (result.isProduction) {
  console.log('[check-env] Production mode: CORS_ORIGINS and Supabase validated')
}
//hello