import { Router } from "express";
import * as java from "../lib/javaClient";
import { fetchUserIndex, fetchCourseIndex } from "../lib/javaMappers";

const router = Router();

router.get("/enrollments", async (req, res) => {
  try {
    const { studentId, courseId } = req.query as Record<string, string>;
    const rows = await java.listCursoEstudiante({
      courseId: courseId ? parseInt(courseId) : undefined,
      studentId: studentId ? parseInt(studentId) : undefined,
    });

    const [{ byId: userById }, { byId: courseById }] = await Promise.all([
      fetchUserIndex(),
      fetchCourseIndex(),
    ]);

    return res.json(rows.map((r) => {
      const student = userById.get(r.id_estudiante);
      const course = courseById.get(r.id_curso);
      return {
        id: r.id,
        studentId: r.id_estudiante,
        studentName: student ? `${student.nombre} ${student.apellido}` : "Desconocido",
        studentRut: student?.rut ?? "",
        courseId: r.id_curso,
        courseName: course?.nombre ?? "Desconocido",
      };
    }));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/enrollments", async (req, res) => {
  try {
    const { studentId, courseId } = req.body as { studentId: number; courseId: number };
    const row = await java.createCursoEstudiante({ id_curso: courseId, id_estudiante: studentId });
    const [{ byId: userById }, { byId: courseById }] = await Promise.all([
      fetchUserIndex(),
      fetchCourseIndex(),
    ]);
    const student = userById.get(studentId);
    const course = courseById.get(courseId);
    return res.status(201).json({
      id: row.id,
      studentId,
      studentName: student ? `${student.nombre} ${student.apellido}` : "Desconocido",
      studentRut: student?.rut ?? "",
      courseId,
      courseName: course?.nombre ?? "Desconocido",
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al matricular alumno" });
  }
});

router.delete("/enrollments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await java.deleteCursoEstudiante(id);
    return res.json({ message: "Alumno desmatriculado" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al desmatricular" });
  }
});

export default router;
