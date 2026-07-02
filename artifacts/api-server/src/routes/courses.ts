import { Router } from "express";
import * as java from "../lib/javaClient";
import {
  fetchCourseIndex,
  fetchUserById,
  fetchUserIndex,
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
    req.log.warn({ err }, "Gestion_Cursos unavailable — returning empty course list");
    return res.json([]);
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

router.patch("/courses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, profesorId } = req.body;

    const current = await java.getCurso(id).catch(() => null);
    if (!current) return res.status(404).json({ error: "Curso no encontrado" });

    const { nivel_curso, letra } = nombre
      ? splitCourseName(nombre)
      : { nivel_curso: current.nivel_curso, letra: current.letra };

    let id_docente = current.docente?.id_docente;
    if (profesorId !== undefined && profesorId !== current.docente?.id_usuario) {
      const profesorUser = await fetchUserById(profesorId);
      const docente = await ensureDocenteForUser(
        profesorId,
        profesorUser ? `${profesorUser.nombre} ${profesorUser.apellido}` : `Profesor ${profesorId}`,
      );
      id_docente = docente.id_docente;
    }

    const curso = await java.updateCurso({
      id_curso: id,
      letra,
      nivel_curso,
      id_sala: current.id_sala,
      id_docente: id_docente!,
    });

    const { byId: userById } = await fetchUserIndex();
    return res.json(toCourse(curso, userById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar curso" });
  }
});

router.delete("/courses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await java.deleteCurso(id);
    return res.json({ message: "Curso eliminado" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al eliminar curso" });
  }
});

export default router;
