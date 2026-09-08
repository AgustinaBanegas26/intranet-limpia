require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const bcrypt = require("bcrypt");
const supabase = require("../src/config/supabase");

const users = [
  {
    email: "wd236.dev@gmail.com",
    nombre: "Administrador",
    apellido: "Principal",
    legajo: "ADMIN-001",
    role: "admin",
    password: process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!",
  },
  {
    email: "sarawillerslohr08@gmail.com",
    nombre: "Sara",
    apellido: "Willers Lohr",
    legajo: "EMP-001",
    role: "empleado",
    password: process.env.DEFAULT_NEW_EMPLOYEE_PASSWORD || "Empleado123!",
  },
  {
    email: "agustinabanegas26@gmail.com",
    nombre: "Agustina",
    apellido: "Banegas",
    legajo: "EMP-002",
    role: "empleado",
    password: process.env.DEFAULT_NEW_EMPLOYEE_PASSWORD || "Empleado123!",
  },
];

async function saveUser(user) {
  const email = user.email.toLowerCase();
  const password_hash = await bcrypt.hash(user.password, 10);
  const common = {
    nombre: user.nombre,
    apellido: user.apellido,
    email_corporativo: email,
    role: user.role,
    es_director: false,
    activo: true,
    must_change_password: true,
    password_hash,
    work_mode: "office",
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: findError } = await supabase
    .from("empleados")
    .select("id")
    .eq("email_corporativo", email)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from("empleados")
      .update(common)
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`Updated ${email} as ${user.role}`);
    return;
  }

  const { error } = await supabase.from("empleados").insert({
    ...common,
    legajo: user.legajo,
  });
  if (error) throw error;
  console.log(`Created ${email} as ${user.role}`);
}

async function main() {
  for (const user of users) await saveUser(user);
  console.log("Default users synchronized.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
