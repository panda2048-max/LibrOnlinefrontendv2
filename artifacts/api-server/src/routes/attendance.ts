import { Router } from "express";
import * as java from "../lib/javaClient";
import {
  fetchAttendanceContext,
  toAttendance,
  PRESENT_ESTADO,
  ABSENT_ESTADO,
  fetchUserById,
} from "../lib/javaMappers";

const router = Router();

router.get("/attendance", async (req, res) => {
  try {
    const { courseId, studentId } = req.query as Record<string, string>;
    const { records, userById, courseById } = await fetchAttendanceContext();
    let filtered = records;
    if (courseId) filtered = filtered.filter((r) => r.id_curso === parseInt(courseId));
    if (studentId) filtered = filtered.filter((r) => r.id_usuarios === parseInt(studentId));
    return res.json(filtered.map((r) => toAttendance(r, userById, courseById)));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/attendance", async (req, res) => {
  try {
    const { studentId, courseId, date, present } = req.body;
    const student = await fetchUserById(studentId);
    const created = await java.createAsistencia({
      estudiante: student ? `${student.nombre} ${student.apellido}` : `Alumno ${studentId}`,
      fecha: date,
      estado: present ? PRESENT_ESTADO : ABSENT_ESTADO,
      id_usuarios: studentId,
      id_curso: courseId,
    });
    const { userById, courseById } = await fetchAttendanceContext();
    return res.status(201).json(toAttendance(created, userById, courseById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear asistencia" });
  }
});

router.patch("/attendance/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { present } = req.body;
    const existing = await java.getAsistencia(id);
    if (!existing) return res.status(404).json({ error: "Registro no encontrado" });
    const updated = await java.updateAsistencia(id, {
      id,
      estudiante: existing.estudiante,
      fecha: existing.fecha,
      estado: present ? PRESENT_ESTADO : ABSENT_ESTADO,
      id_curso: existing.id_curso,
    });
    const { userById, courseById } = await fetchAttendanceContext();
    return res.json(toAttendance(updated, userById, courseById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar asistencia" });
  }
});

export default router;
