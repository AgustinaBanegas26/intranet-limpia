const bcrypt = require('bcrypt')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const supabase = require('../src/config/supabase')

const EMPLOYEE_PASSWORD = process.env.DEFAULT_NEW_EMPLOYEE_PASSWORD || 'Empleado123!'
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'gisela@gruponucleo.com.ar')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || '').trim().toLowerCase())
}

async function setPassword(email, plainPassword, mustChangePassword = true) {
  const password_hash = await bcrypt.hash(plainPassword, 10)

  const { error } = await supabase
    .from('empleados')
    .update({
      password_hash,
      must_change_password: mustChangePassword,
      work_mode: 'office',
      activo: true,
    })
    .eq('email_corporativo', email)

  if (error) {
    throw error
  }

  console.log('Updated', email)
}

async function main() {
  const { data: empleados, error } = await supabase
    .from('empleados')
    .select('email_corporativo')
    .order('id')

  if (error) throw error

  for (const row of empleados || []) {
    if (!row.email_corporativo) continue
    const password = isAdminEmail(row.email_corporativo) ? ADMIN_PASSWORD : EMPLOYEE_PASSWORD
    await setPassword(row.email_corporativo, password, true)
  }

  console.log(
    `Finished — ${empleados?.length || 0} empleados (admin: ${ADMIN_PASSWORD}, resto: ${EMPLOYEE_PASSWORD})`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
