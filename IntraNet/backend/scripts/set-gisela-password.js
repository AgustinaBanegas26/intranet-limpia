require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const bcrypt = require('bcrypt')
const supabase = require('../src/config/supabase')

const GISELA_EMAIL = 'gisela@gruponucleo.com.ar'
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!'

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  const { data: empleado, error: fetchError } = await supabase
    .from('empleados')
    .select('id, email_corporativo, nombre, apellido, es_director')
    .eq('email_corporativo', GISELA_EMAIL)
    .single()

  if (fetchError || !empleado) {
    throw fetchError || new Error(`No se encontró ${GISELA_EMAIL}`)
  }

  console.log('Empleado:', empleado.email_corporativo, empleado.nombre, empleado.apellido)

  const { error } = await supabase
    .from('empleados')
    .update({
      password_hash: passwordHash,
      must_change_password: true,
    })
    .eq('id', empleado.id)

  if (error) throw error

  const verify = await bcrypt.compare(ADMIN_PASSWORD, passwordHash)
  console.log(`Contraseña actualizada a ${ADMIN_PASSWORD} | verify: ${verify}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
