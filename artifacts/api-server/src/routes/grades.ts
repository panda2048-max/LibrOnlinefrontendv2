import { Router } from "express";
import * as java from "../lib/javaClient";
import { fetchGradeContext, toGrade } from "../lib/javaMappers";

const router = Router();

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/grades", async (req, res) => {
  try {
    const { studentId, courseId, rut } = req.query as Record<string, string>;
    const { notas, userIndex, courseById } = await fetchGradeContext();
    let filtered = notas;

    let targetRut = rut;
    if (studentId) {
      const student = userIndex.byId.get(parseInt(studentId));
      targetRut = student?.rut ?? "__none__";
    }
    if (targetRut) filtered = filtered.filter((n) => n.rut_usuario === targetRut);
    if (courseId) filtered = filtered.filter((n) => n.evaluacion?.id_curso === parseInt(courseId));

    return res.json(filtered.map((n) => toGrade(n, userIndex, courseById)));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/grades", async (req, res) => {
  try {
    const { studentId, courseId, evaluationName, value } = req.body;
    const { userIndex, courseById } = await fetchGradeContext();
    const student = userIndex.byId.get(studentId);
    if (!student) return res.status(404).json({ error: "Alumno no encontrado" });
    const course = courseById.get(courseId);

    const evaluacion = await java.createEvaluacion({
      fecha_evaluacion: todayDate(),
      asignatura: course?.nombre ?? "General",
      tipo_evaluacion: evaluationName,
      id_usuarios: course?.profesorId || student.id,
      id_curso: courseId,
    });
    const nota = await java.createNota({
      calificacion: String(value),
      id_evaluacion: evaluacion.id_evaluacion,
      rut_usuario: student.rut,
    });
    return res.status(201).json(toGrade({ ...nota, evaluacion }, userIndex, courseById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear nota" });
  }
});

router.patch("/grades/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { evaluationName, value } = req.body;
    const existing = await java.getNota(id).catch(() => null);
    if (!existing) return res.status(404).json({ error: "Nota no encontrada" });

    if (value !== undefined) {
      await java.updateNota({ id_nota: id, calificacion: String(value) });
    }
    if (evaluationName && existing.evaluacion) {
      await java.updateEvaluacion(existing.evaluacion.id_evaluacion, {
        fecha_evaluacion: existing.evaluacion.fecha_evaluacion,
        asignatura: existing.evaluacion.asignatura,
        tipo_evaluacion: evaluationName,
        id_curso: existing.evaluacion.id_curso,
      });
    }

    const updated = await java.getNota(id);
    const { userIndex, courseById } = await fetchGradeContext();
    return res.json(toGrade(updated, userIndex, courseById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar nota" });
  }
});

router.delete("/grades/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await java.deleteNota(id);
    return res.json({ message: "Nota eliminada" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al eliminar nota" });
  }
});

router.get("/grades/average/:studentId/:courseId", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courseId = parseInt(req.params.courseId);
    const { notas, userIndex } = await fetchGradeContext();
    const student = userIndex.byId.get(studentId);
    const grades = student
      ? notas.filter((n) => n.rut_usuario === student.rut && n.evaluacion?.id_curso === courseId)
      : [];
    const total = grades.length;
    const avg = total > 0 ? grades.reduce((sum, g) => sum + g.calificacion, 0) / total : 0;
    return res.json({ studentId, courseId, average: Math.round(avg * 10) / 10, totalGrades: total });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

export default router;
