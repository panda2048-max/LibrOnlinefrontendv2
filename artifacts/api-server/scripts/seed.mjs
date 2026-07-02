// Re-creates demo data through the gateway (not directly against Java), so it
// exercises the exact same orchestration the UI relies on.
//
// Usage: node scripts/seed.mjs
// (the gateway and ALL Java microservices must already be running)

const BASE = process.env.GATEWAY_URL ?? "http://localhost:8080/api";

const DEMO_USERS = [
  { rut: "12345678-9", nombre: "Carlos",   apellido: "Mendoza",  role: "alumno",    email: "carlos.mendoza@instituto.cl"   },
  { rut: "23456789-0", nombre: "Sofia",    apellido: "Vargas",   role: "alumno",    email: "sofia.vargas@instituto.cl"     },
  { rut: "34567890-1", nombre: "Diego",    apellido: "Torres",   role: "apoderado", email: "diego.torres@instituto.cl"     },
  { rut: "45678901-2", nombre: "Laura",    apellido: "Jimenez",  role: "profesor",  email: "laura.jimenez@instituto.cl"    },
  { rut: "56789012-3", nombre: "Marco",    apellido: "Rios",     role: "profesor",  email: "marco.rios@instituto.cl"       },
  { rut: "67890123-4", nombre: "Patricia", apellido: "Soto",     role: "inspector", email: "patricia.soto@instituto.cl"    },
  { rut: "78901234-5", nombre: "Roberto",  apellido: "Alvarado", role: "admin",     email: "roberto.alvarado@instituto.cl" },
];

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log(`Sembrando datos demo via ${BASE} ...`);

  // ── Fetch existing users once to skip duplicates ──────────────────────────
  const existingUsers = await request("GET", "/users");
  const byRut = Object.fromEntries(existingUsers.map(u => [u.rut, u]));

  const createdUsers = {};
  for (const demo of DEMO_USERS) {
    if (byRut[demo.rut]) {
      createdUsers[demo.rut] = byRut[demo.rut];
      console.log(`  usuario existente: ${demo.nombre} ${demo.apellido} (id ${byRut[demo.rut].id})`);
    } else {
      const user = await request("POST", "/users", { ...demo, password: "password123" });
      createdUsers[demo.rut] = user;
      console.log(`  usuario creado: ${demo.nombre} ${demo.apellido} (id ${user.id}, rol ${demo.role})`);
    }
  }

  // ── Courses & enrollments (require Gestion_Cursos on port 5003) ──────────
  const profesora = createdUsers["45678901-2"];
  const profesor2 = createdUsers["56789012-3"];
  let createdCourses = [];

  try {
    const existingCourses = await request("GET", "/courses");

    const demoCourseDefs = [
      { nombre: "1° A", descripcion: "Matematica, Lenguaje", profesorId: profesora.id },
      { nombre: "1° B", descripcion: "Ciencias, Historia",   profesorId: profesor2.id },
    ];

    for (const def of demoCourseDefs) {
      const existing = existingCourses.find(c => c.nombre === def.nombre);
      if (existing) {
        createdCourses.push(existing);
        console.log(`  curso existente: ${existing.nombre} (id ${existing.id})`);
      } else {
        const course = await request("POST", "/courses", def);
        createdCourses.push(course);
        console.log(`  curso creado: ${course.nombre} (id ${course.id}, profesor ${course.profesorNombre})`);
      }
    }

    // ── Enroll students ─────────────────────────────────────────────────────
    const alumnos = DEMO_USERS.filter(u => u.role === "alumno").map(u => createdUsers[u.rut]);
    const existingEnrollments = await request("GET", "/enrollments");
    const enrolledSet = new Set(existingEnrollments.map(e => `${e.studentId}-${e.courseId}`));

    for (const course of createdCourses) {
      for (const alumno of alumnos) {
        if (!enrolledSet.has(`${alumno.id}-${course.id}`)) {
          await request("POST", "/enrollments", { studentId: alumno.id, courseId: course.id });
          console.log(`  matriculado: ${alumno.nombre} en ${course.nombre}`);
        } else {
          console.log(`  matricula existente: ${alumno.nombre} en ${course.nombre}`);
        }
      }
    }
  } catch (err) {
    console.warn(`\n  ADVERTENCIA: cursos/matriculas omitidos — ${err.message}`);
    console.warn("  Inicia Gestion_Cursos (puerto 5003) y vuelve a ejecutar el seed.");
  }

  console.log("\nListo. Datos demo disponibles:");
  console.log("  Alumnos:   Carlos Mendoza, Sofia Vargas");
  console.log("  Profesor:  Laura Jimenez (1\xb0 A), Marco Rios (1\xb0 B)");
  console.log("  Inspector: Patricia Soto");
  console.log("  Admin:     Roberto Alvarado");
  console.log("  Password de todos: password123");
}

main().catch(err => { console.error("\nError:", err.message); process.exit(1); });
