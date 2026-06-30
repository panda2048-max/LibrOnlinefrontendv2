import { Router } from "express";
import * as java from "../lib/javaClient";
import {
  fetchCourseIndex,
  fetchUserById,
  toCourse,
  splitCourseName,
  defaultSalaIdForCurso,
  ensureDocenteForUser,
} from "../lib/javaMappers";

const router = Router();

router.get("/courses", async (req, res) => {
  try {
    const { courses } = await fetchCourseIndex();
    return res.json(courses);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/courses", async (req, res) => {
  try {
    const { nombre, profesorId } = req.body;
    const profesorUser = await fetchUserById(profesorId);
    const docente = await ensureDocenteForUser(
      profesorId,
      profesorUser ? `${profesorUser.nombre} ${profesorUser.apellido}` : `Profesor ${profesorId}`,
    );
    const { nivel_curso, letra } = splitCourseName(nombre);
    const id_sala = await defaultSalaIdForCurso();
    const curso = await java.createCurso({
      letra,
      nivel_curso,
      id_sala,
      id_docente: docente.id_docente,
      id_asignaturas: [],
      id_usuarios: profesorId,
    });
    const userById = profesorUser ? new Map([[profesorUser.id, profesorUser]]) : new Map();
    return res.status(201).json(toCourse(curso, userById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear curso" });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { byId } = await fetchCourseIndex();
    const course = byId.get(id);
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });
    return res.json(course);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

export default router;
