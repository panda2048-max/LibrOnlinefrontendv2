// Translates Java microservice entities into the OpenAPI schemas the
// frontend already expects (see lib/api-spec/openapi.yaml), and back.
import * as java from "./javaClient";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  telefono: string | null;
}

// Java requires all 4 name parts NotBlank, but the frontend only collects a
// single `nombre` + `apellido`. This placeholder fills the unused slot and is
// stripped back out when rebuilding the display name, so single-word names
// round-trip cleanly instead of getting duplicated or showing a literal "-".
const NAME_PLACEHOLDER = "-";

export function splitName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [NAME_PLACEHOLDER, NAME_PLACEHOLDER];
  if (parts.length === 1) return [parts[0], NAME_PLACEHOLDER];
  return [parts[0], parts.slice(1).join(" ")];
}

function joinName(first: string, second: string): string {
  return [first, second].filter((p) => p && p !== NAME_PLACEHOLDER).join(" ");
}

function buildUser(u: java.JavaUsuario, rol: java.JavaRol | undefined, email: java.JavaEmail | undefined): User {
  return {
    id: u.id_usuarios,
    rut: u.runUsuario,
    nombre: joinName(u.primer_nombre, u.segundo_nombre),
    apellido: joinName(u.ap_paterno, u.ap_materno),
    email: email?.email ?? "",
    role: rol?.tipo_rol ?? "alumno",
    telefono: u.telefono ?? null,
  };
}

export interface UserIndex {
  users: User[];
  byId: Map<number, User>;
  byRut: Map<string, User>;
}

export async function fetchUserIndex(): Promise<UserIndex> {
  const [usuarios, roles, emails] = await Promise.all([
    java.listUsuarios(),
    java.listRoles(),
    java.listEmails(),
  ]);
  const roleByUserId = new Map<number, java.JavaRol>();
  for (const r of roles) if (r.usuarios) roleByUserId.set(r.usuarios.id_usuarios, r);
  const emailByUserId = new Map<number, java.JavaEmail>();
  for (const e of emails) if (e.usuarios) emailByUserId.set(e.usuarios.id_usuarios, e);

  const users = usuarios.map((u) => buildUser(u, roleByUserId.get(u.id_usuarios), emailByUserId.get(u.id_usuarios)));
  return {
    users,
    byId: new Map(users.map((u) => [u.id, u])),
    byRut: new Map(users.map((u) => [u.rut, u])),
  };
}

export async function fetchUserById(id: number): Promise<User | null> {
  const [usuario, roles, emails] = await Promise.all([
    java.getUsuario(id).catch(() => null),
    java.listRoles(),
    java.listEmails(),
  ]);
  if (!usuario) return null;
  const rol = roles.find((r) => r.usuarios?.id_usuarios === id);
  const email = emails.find((e) => e.usuarios?.id_usuarios === id);
  return buildUser(usuario, rol, email);
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export interface Course {
  id: number;
  nombre: string;
  descripcion: string | null;
  profesorId: number;
  profesorNombre: string;
}

export function toCourse(curso: java.JavaCurso, userById: Map<number, User>): Course {
  const profesorId = curso.docente?.id_usuario ?? 0;
  const profesorUser = profesorId ? userById.get(profesorId) : undefined;
  const profesorNombre = profesorUser
    ? `${profesorUser.nombre} ${profesorUser.apellido}`
    : (curso.docente?.nombre ?? "Sin asignar");
  return {
    id: curso.id_curso,
    nombre: `${curso.nivel_curso}° ${curso.letra}`,
    descripcion: curso.asignaturas?.length
      ? curso.asignaturas.map((a) => a.nombre_asignatura).join(", ")
      : null,
    profesorId,
    profesorNombre,
  };
}

export interface CourseIndex {
  courses: Course[];
  byId: Map<number, Course>;
}

export async function fetchCourseIndex(): Promise<CourseIndex> {
  const [cursos, { byId: userById }] = await Promise.all([java.listCursos(), fetchUserIndex()]);
  const courses = cursos.map((c) => toCourse(c, userById));
  return { courses, byId: new Map(courses.map((c) => [c.id, c])) };
}

// Course "letra"/"nivel_curso" parsing for the legacy CourseInput{nombre, descripcion, profesorId}
// shape — the admin UI never actually exercises POST /courses today, but the
// contract still needs a best-effort split for callers (e.g. seed scripts)
// that only send `nombre`.
export function splitCourseName(nombre: string): { nivel_curso: string; letra: string } {
  const match = nombre.match(/^(.*\S)\s*°?\s*([A-Za-z])$/);
  if (match) {
    return { nivel_curso: match[1].replace(/°$/, "").trim(), letra: match[2].toUpperCase() };
  }
  return { nivel_curso: nombre.trim(), letra: "A" };
}

export async function ensureDocenteForUser(
  userId: number,
  displayName: string,
  especialidad = "General",
): Promise<java.JavaDocente> {
  const docentes = await java.listDocentes();
  const existing = docentes.find((d) => d.id_usuario === userId);
  if (existing) return existing;
  return java.createDocente({ nombre_docente: displayName, especialidad, id_usuario: userId });
}

let defaultSalaIdForCursoCache: number | null = null;
export async function defaultSalaIdForCurso(): Promise<number> {
  // Curso.id_sala has no real FK inside Gestion_Cursos's own database, so any
  // integer is accepted — we just need a stable placeholder.
  if (defaultSalaIdForCursoCache === null) defaultSalaIdForCursoCache = 1;
  return defaultSalaIdForCursoCache;
}

// ---------------------------------------------------------------------------
// Grades
// ---------------------------------------------------------------------------

export interface Grade {
  id: number;
  studentId: number;
  studentName: string;
  studentRut: string;
  courseId: number;
  courseName: string;
  evaluationName: string;
  value: number;
}

export function toGrade(nota: java.JavaNota, userIndex: UserIndex, courseById: Map<number, Course>): Grade {
  const student = userIndex.byRut.get(nota.rut_usuario);
  const courseId = nota.evaluacion?.id_curso ?? 0;
  const course = courseById.get(courseId);
  return {
    id: nota.id_nota,
    studentId: student?.id ?? 0,
    studentName: student ? `${student.nombre} ${student.apellido}` : "Desconocido",
    studentRut: nota.rut_usuario,
    courseId,
    courseName: course?.nombre ?? "Desconocido",
    evaluationName: nota.evaluacion?.tipo_evaluacion ?? "Evaluación",
    value: nota.calificacion,
  };
}

export async function fetchGradeContext() {
  const [notas, userIndex, { byId: courseById }] = await Promise.all([
    java.listNotas(),
    fetchUserIndex(),
    fetchCourseIndex(),
  ]);
  return { notas, userIndex, courseById };
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  date: string;
  present: boolean;
}

export const PRESENT_ESTADO = "presente";
export const ABSENT_ESTADO = "ausente";

export function toAttendance(a: java.JavaAsistencia, userById: Map<number, User>, courseById: Map<number, Course>): AttendanceRecord {
  const student = userById.get(a.id_usuarios);
  const course = a.id_curso != null ? courseById.get(a.id_curso) : undefined;
  return {
    id: a.id,
    studentId: a.id_usuarios,
    studentName: student ? `${student.nombre} ${student.apellido}` : a.estudiante,
    courseId: a.id_curso ?? 0,
    courseName: course?.nombre ?? "Desconocido",
    date: a.fecha,
    present: a.estado === PRESENT_ESTADO,
  };
}

export async function fetchAttendanceContext() {
  const [records, { byId: userById }, { byId: courseById }] = await Promise.all([
    java.listAsistencias(),
    fetchUserIndex(),
    fetchCourseIndex(),
  ]);
  return { records, userById, courseById };
}

// ---------------------------------------------------------------------------
// Annotations
// ---------------------------------------------------------------------------

export interface Annotation {
  id: number;
  studentId: number;
  studentName: string;
  inspectorId: number;
  inspectorName: string;
  type: string;
  description: string;
  date: string;
}

export function toAnnotation(a: java.JavaAnotacion, userById: Map<number, User>): Annotation {
  const student = userById.get(a.id_usuarios);
  const inspector = a.id_inspector != null ? userById.get(a.id_inspector) : undefined;
  return {
    id: a.id,
    studentId: a.id_usuarios,
    studentName: student ? `${student.nombre} ${student.apellido}` : "Desconocido",
    inspectorId: a.id_inspector ?? 0,
    inspectorName: inspector ? `${inspector.nombre} ${inspector.apellido}` : "Desconocido",
    type: a.tipo,
    description: a.descripcion,
    date: a.fechaCreacion,
  };
}

export async function fetchAnnotationContext() {
  const [records, { byId: userById }] = await Promise.all([java.listAnotaciones(), fetchUserIndex()]);
  return { records, userById };
}

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

export interface Meeting {
  id: number;
  requestedById: number;
  requestedByName: string;
  withUserId: number;
  withUserName: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  status: string;
}

export function toMeeting(r: java.JavaReunion, userById: Map<number, User>): Meeting {
  const requester = userById.get(r.id_usuarios);
  const withUserId = r.id_usuario_2 ?? 0;
  const withUser = withUserId ? userById.get(withUserId) : undefined;
  return {
    id: r.id_reunion,
    requestedById: r.id_usuarios,
    requestedByName: requester ? `${requester.nombre} ${requester.apellido}` : "Desconocido",
    withUserId,
    withUserName: withUser ? `${withUser.nombre} ${withUser.apellido}` : "Desconocido",
    title: r.asunto,
    description: null,
    scheduledAt: combineDateTime(r.fecha, r.hora_inicio),
    status: r.estado,
  };
}

export function combineDateTime(fecha: string, hora: string): string {
  // fecha: "YYYY-MM-DD", hora: "HH:mm:ss" → ISO-ish "YYYY-MM-DDTHH:mm:ss"
  return `${fecha}T${hora}`;
}

export function splitDateTime(scheduledAt: string): { fecha: string; hora_inicio: string; hora_fin: string } {
  // Parsed as plain text (no Date object) so we never shift hours/days due to
  // timezone conversion — the string is stored exactly as typed in the UI.
  const match = scheduledAt.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    throw new Error(`scheduledAt inválido: ${scheduledAt}`);
  }
  const [, fecha, hh, mm, ss = "00"] = match;
  const hora_inicio = `${hh}:${mm}:${ss}`;
  const hora_fin = `${String((Number(hh) + 1) % 24).padStart(2, "0")}:${mm}:${ss}`;
  return { fecha, hora_inicio, hora_fin };
}

export async function fetchMeetingContext() {
  const [records, { byId: userById }] = await Promise.all([java.listReuniones(), fetchUserIndex()]);
  return { records, userById };
}

let defaultSalaIdForReunionCache: number | null = null;
export async function defaultSalaIdForReunion(): Promise<number> {
  if (defaultSalaIdForReunionCache !== null) return defaultSalaIdForReunionCache;
  const salas = await java.listSalas();
  if (salas.length > 0) {
    defaultSalaIdForReunionCache = salas[0].id_sala;
  } else {
    const created = await java.createSala({ piso: "1" });
    defaultSalaIdForReunionCache = created.id_sala;
  }
  return defaultSalaIdForReunionCache;
}
