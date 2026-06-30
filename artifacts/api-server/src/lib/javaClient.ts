// Thin client for the Java Spring Boot microservices backend (LIbrOnline-Backend).
// Each function maps 1:1 to one Java REST endpoint and returns the raw Java
// entity shape (snake_case fields, as produced by Jackson's defaults).

const BASE_URLS = {
  usuarios: process.env["USUARIOS_API_URL"] ?? "http://localhost:5000",
  cursos: process.env["CURSOS_API_URL"] ?? "http://localhost:5003",
  notas: process.env["NOTAS_API_URL"] ?? "http://localhost:8000",
  asistencia: process.env["ASISTENCIA_API_URL"] ?? "http://localhost:5005",
  anotaciones: process.env["ANOTACIONES_API_URL"] ?? "http://localhost:5006",
  reuniones: process.env["REUNIONES_API_URL"] ?? "http://localhost:5002",
} as const;

export class JavaApiError extends Error {
  readonly status: number;
  readonly service: string;
  readonly body: unknown;

  constructor(service: string, status: number, path: string, body: unknown) {
    super(`Java service "${service}" ${path} respondió ${status}`);
    this.name = "JavaApiError";
    this.status = status;
    this.service = service;
    this.body = body;
  }
}

async function javaFetch<T>(
  service: keyof typeof BASE_URLS,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BASE_URLS[service]}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new JavaApiError(service, response.status, path, data);
  }

  return data as T;
}

const get = <T>(service: keyof typeof BASE_URLS, path: string) =>
  javaFetch<T>(service, path, { method: "GET" });

const post = <T>(service: keyof typeof BASE_URLS, path: string, body: unknown) =>
  javaFetch<T>(service, path, { method: "POST", body: JSON.stringify(body) });

const put = <T>(service: keyof typeof BASE_URLS, path: string, body: unknown) =>
  javaFetch<T>(service, path, { method: "PUT", body: JSON.stringify(body) });

const del = <T>(service: keyof typeof BASE_URLS, path: string) =>
  javaFetch<T>(service, path, { method: "DELETE" });

// ---------------------------------------------------------------------------
// Usuarios (puerto 5000)
// ---------------------------------------------------------------------------

export interface JavaUsuario {
  id_usuarios: number;
  runUsuario: string;
  primer_nombre: string;
  segundo_nombre: string;
  ap_paterno: string;
  ap_materno: string;
  password: string;
  telefono: string;
}

export interface JavaRol {
  id_rol: number;
  tipo_rol: string;
  usuarios: JavaUsuario;
}

export interface JavaEmail {
  id_email: number;
  email: string;
  usuarios: JavaUsuario;
}

export interface JavaLoginResponse {
  id_usuarios: number;
  runUsuario: string;
  primer_nombre: string;
}

export const listUsuarios = () => get<JavaUsuario[]>("usuarios", "/usuario");
export const getUsuario = (id: number) => get<JavaUsuario>("usuarios", `/usuario/${id}`);
export const createUsuario = (data: {
  runUsuario: string;
  primer_nombre: string;
  segundo_nombre: string;
  ap_paterno: string;
  ap_materno: string;
  password: string;
  telefono: string;
}) => post<JavaUsuario>("usuarios", "/usuario", data);
export const updateUsuario = (data: {
  id_usuario: number;
  runUsuario: string;
  primer_nombre: string;
  segundo_nombre: string;
  ap_paterno: string;
  ap_materno: string;
  password: string;
  telefono: string;
}) => put<JavaUsuario>("usuarios", "/usuario", data);
export const deleteUsuario = (id: number) => del<string>("usuarios", `/usuario/${id}`);
export const loginUsuario = (data: { runUsuario: string; password: string }) =>
  post<JavaLoginResponse>("usuarios", "/usuario/login", data);

export const listRoles = () => get<JavaRol[]>("usuarios", "/rol");
export const createRol = (data: { id_usuario: number; tipo_rol: string }) =>
  post<JavaRol>("usuarios", "/rol", data);
export const updateRol = (data: { id_rol: number; tipo_rol: string }) =>
  put<JavaRol>("usuarios", "/rol", data);

export const listEmails = () => get<JavaEmail[]>("usuarios", "/email");
export const createEmail = (data: { id_usuario: number; email: string }) =>
  post<JavaEmail>("usuarios", "/email", data);
export const updateEmail = (data: { id_email: number; email: string }) =>
  put<JavaEmail>("usuarios", "/email", data);

// ---------------------------------------------------------------------------
// Gestion_Cursos (puerto 5003)
// ---------------------------------------------------------------------------

export interface JavaAsignatura {
  id_asignatura: number;
  nombre_asignatura: string;
}

export interface JavaDocente {
  id_docente: number;
  nombre: string;
  especialidad: string;
  id_usuario: number | null;
}

export interface JavaCurso {
  id_curso: number;
  letra: string;
  nivel_curso: string;
  id_sala: number;
  id_usuarios: number;
  docente: JavaDocente;
  asignaturas: JavaAsignatura[];
}

export const listCursos = () => get<JavaCurso[]>("cursos", "/curso");
export const getCurso = (id: number) => get<JavaCurso>("cursos", `/curso/${id}`);
export const createCurso = (data: {
  letra: string;
  nivel_curso: string;
  id_sala: number;
  id_docente: number;
  id_asignaturas: number[];
  id_usuarios: number;
}) => post<JavaCurso>("cursos", "/curso", data);

export const listDocentes = () => get<JavaDocente[]>("cursos", "/docente");
export const createDocente = (data: {
  nombre_docente: string;
  especialidad: string;
  id_usuario: number;
}) => post<JavaDocente>("cursos", "/docente", data);

export const listAsignaturas = () => get<JavaAsignatura[]>("cursos", "/asignatura");

// ---------------------------------------------------------------------------
// Notas (puerto 8000)
// ---------------------------------------------------------------------------

export interface JavaEvaluacion {
  id_evaluacion: number;
  fecha_evaluacion: string;
  asignatura: string;
  tipo_evaluacion: string;
  id_usuarios: number;
  id_curso: number | null;
}

export interface JavaNota {
  id_nota: number;
  calificacion: number;
  prom_calificacion: number | null;
  evaluacion: JavaEvaluacion;
  rut_usuario: string;
}

export const listNotas = () => get<JavaNota[]>("notas", "/nota");
export const createNota = (data: {
  calificacion: string;
  id_evaluacion: number;
  rut_usuario: string;
}) => post<JavaNota>("notas", "/nota", data);
export const updateNota = (data: { id_nota: number; calificacion: string }) =>
  put<JavaNota>("notas", "/nota", data);
export const deleteNota = (id: number) => del<string>("notas", `/nota/${id}`);

export const getNota = (id: number) => get<JavaNota>("notas", `/nota/${id}`);

export const listEvaluaciones = () => get<JavaEvaluacion[]>("notas", "/evaluacion");
export const createEvaluacion = (data: {
  fecha_evaluacion: string;
  asignatura: string;
  tipo_evaluacion: string;
  id_usuarios: number;
  id_curso: number | null;
}) => post<JavaEvaluacion>("notas", "/evaluacion", data);
export const updateEvaluacion = (
  id: number,
  data: { fecha_evaluacion: string; asignatura: string; tipo_evaluacion: string; id_curso: number | null },
) => put<JavaEvaluacion>("notas", `/evaluacion/${id}`, data);

// ---------------------------------------------------------------------------
// Asistencia (puerto 5005)
// ---------------------------------------------------------------------------

export interface JavaAsistencia {
  id: number;
  estudiante: string;
  fecha: string;
  estado: string;
  id_usuarios: number;
  id_curso: number | null;
}

export const listAsistencias = () => get<JavaAsistencia[]>("asistencia", "/api/asistencia");
export const getAsistencia = (id: number) =>
  get<JavaAsistencia | null>("asistencia", `/api/asistencia/${id}`);
export const createAsistencia = (data: {
  estudiante: string;
  fecha: string;
  estado: string;
  id_usuarios: number;
  id_curso: number | null;
}) => post<JavaAsistencia>("asistencia", "/api/asistencia", data);
export const updateAsistencia = (
  id: number,
  data: { id: number; estudiante: string; fecha: string; estado: string; id_curso: number | null },
) => put<JavaAsistencia>("asistencia", `/api/asistencia/${id}`, data);

// ---------------------------------------------------------------------------
// Anotaciones (puerto 5006)
// ---------------------------------------------------------------------------

export interface JavaAnotacion {
  id: number;
  tipo: string;
  descripcion: string;
  fechaCreacion: string;
  id_usuarios: number;
  id_inspector: number | null;
}

export const listAnotaciones = () => get<JavaAnotacion[]>("anotaciones", "/anotaciones");
export const getAnotacion = (id: number) => get<JavaAnotacion>("anotaciones", `/anotaciones/${id}`);
export const createAnotacion = (data: {
  tipo: string;
  descripcion: string;
  fechaCreacion: string;
  id_usuarios: number;
  id_inspector: number | null;
}) => post<JavaAnotacion>("anotaciones", "/anotaciones", data);
export const updateAnotacion = (
  id: number,
  data: { id: number; tipo: string; descripcion: string; id_inspector: number | null },
) => put<JavaAnotacion>("anotaciones", `/anotaciones/${id}`, data);
export const deleteAnotacion = (id: number) => del<string>("anotaciones", `/anotaciones/${id}`);

// ---------------------------------------------------------------------------
// Gestion_Reuniones (puerto 5002)
// ---------------------------------------------------------------------------

export interface JavaSala {
  id_sala: number;
  piso: string;
}

export interface JavaReunion {
  id_reunion: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  asunto: string;
  estado: string;
  id_usuarios: number;
  id_usuario_2: number | null;
  sala: JavaSala;
}

export const listReuniones = () => get<JavaReunion[]>("reuniones", "/reunion");
export const getReunion = (id: number) => get<JavaReunion>("reuniones", `/reunion/${id}`);
export const createReunion = (data: {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  asunto: string;
  estado: string;
  id_usuarios: number;
  id_usuario_2: number | null;
  id_sala: number;
}) => post<JavaReunion>("reuniones", "/reunion", data);
export const updateReunion = (data: {
  id_reunion: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  asunto: string;
  estado: string;
  id_usuario_2: number | null;
}) => put<JavaReunion>("reuniones", "/reunion", data);
export const deleteReunion = (id: number) => del<string>("reuniones", `/reunion/${id}`);

export const listSalas = () => get<JavaSala[]>("reuniones", "/sala");
export const createSala = (data: { piso: string }) => post<JavaSala>("reuniones", "/sala", data);
