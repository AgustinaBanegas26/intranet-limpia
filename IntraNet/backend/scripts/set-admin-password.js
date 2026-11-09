//este archivo es para poder hacer pruebas de integración con supertest,(supertest es una libreria de nodejs para hacer pruebas de integración de APIs),
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const bcrypt = require('bcrypt')
const supabase = require('../src/config/supabase')

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!'

// Gestiona la operacion main.
async function main() {
  if (!ADMIN_EMAIL) throw new Error('Definí ADMIN_EMAIL antes de ejecutar este script.')

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const { data: empleado, error: fetchError } = await supabase
    .from('empleados')
    .select('id, email_corporativo, nombre, apellido, es_director')
    .eq('email_corporativo', ADMIN_EMAIL)
    .single()

  if (fetchError || !empleado) throw fetchError || new Error(`No se encontró ${ADMIN_EMAIL}`)

  console.log('Empleado:', empleado.email_corporativo, empleado.nombre, empleado.apellido)
  const { error } = await supabase
    .from('empleados')
    .update({ password_hash: passwordHash, must_change_password: true })
    .eq('id', empleado.id)

  if (error) throw error
  const verify = await bcrypt.compare(ADMIN_PASSWORD, passwordHash)
  console.log(`Contraseña actualizada | verify: ${verify}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})