// Re-creates demo data through the gateway (not directly against Java), so it
// exercises the exact same orchestration the UI relies on. Needed because the
// Java microservices use `ddl-auto=create-drop` and start empty every time.
//
// Usage: GATEWAY_URL=http://localhost:8080/api node scripts/seed.mjs
// (both the gateway and all 6 Java microservices must already be running)

const BASE = process.env.GATEWAY_URL ?? "http://localhost:8080/api";

const DEMO_USERS = [
  { rut: "12345678-9", nombre: "Carlos", apellido: "Mendoza", role: "alumno", email: "carlos.mendoza@instituto.cl" },
  { rut: "23456789-0", nombre: "Sofia", apellido: "Vargas", role: "alumno", email: "sofia.vargas@instituto.cl" },
  { rut: "34567890-1", nombre: "Diego", apellido: "Torres", role: "apoderado", email: "diego.torres@instituto.cl" },
  { rut: "45678901-2", nombre: "Laura", apellido: "Jimenez", role: "profesor", email: "laura.jimenez@instituto.cl" },
  { rut: "56789012-3", nombre: "Marco", apellido: "Rios", role: "profesor", email: "marco.rios@instituto.cl" },
  { rut: "67890123-4", nombre: "Patricia", apellido: "Soto", role: "inspector", email: "patricia.soto@instituto.cl" },
  { rut: "78901234-5", nombre: "Roberto", apellido: "Alvarado", role: "admin", email: "roberto.alvarado@instituto.cl" },
];

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`POST ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log(`Sembrando datos demo via ${BASE} ...`);
  const createdUsers = {};

  for (const demo of DEMO_USERS) {
    const user = await post("/users", { ...demo, password: "password123" });
    createdUsers[demo.rut] = user;
    console.log(`  usuario creado: ${demo.nombre} ${demo.apellido} (id ${user.id}, rol ${demo.role})`);
  }

  const profesora = createdUsers["45678901-2"];
  const course = await post("/courses", {
    nombre: "1° A",
    descripcion: "Curso demo",
    profesorId: profesora.id,
  });
  console.log(`  curso creado: ${course.nombre} (id ${course.id}, profesor ${course.profesorNombre})`);

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
