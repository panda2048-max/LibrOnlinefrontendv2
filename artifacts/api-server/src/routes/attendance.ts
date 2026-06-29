import { Router } from "express";
import { db } from "@workspace/db";
import { attendanceTable, usersTable, coursesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function enrichAttendance(a: typeof attendanceTable.$inferSelect) {
  const student = await db.select().from(usersTable).where(eq(usersTable.id, a.studentId)).limit(1);
  const course = await db.select().from(coursesTable).where(eq(coursesTable.id, a.courseId)).limit(1);
  return {
    id: a.id,
    studentId: a.studentId,
    studentName: student[0] ? `${student[0].nombre} ${student[0].apellido}` : "Desconocido",
    courseId: a.courseId,
    courseName: course[0]?.nombre || "Desconocido",
    date: a.date,
    present: a.present,
  };
}

router.get("/attendance", async (req, res) => {
  try {
    const { courseId, studentId } = req.query as Record<string, string>;
    let records = await db.select().from(attendanceTable);
    if (courseId) records = records.filter(r => r.courseId === parseInt(courseId));
    if (studentId) records = records.filter(r => r.studentId === parseInt(studentId));
    const result = await Promise.all(records.map(enrichAttendance));
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/attendance", async (req, res) => {
  try {
    const { studentId, courseId, date, present } = req.body;
    const inserted = await db.insert(attendanceTable).values({ studentId, courseId, date, present }).returning();
    const result = await enrichAttendance(inserted[0]);
    return res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear asistencia" });
  }
});

router.patch("/attendance/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { present } = req.body;
    const updated = await db.update(attendanceTable).set({ present }).where(eq(attendanceTable.id, id)).returning();
    if (!updated[0]) return res.status(404).json({ error: "Registro no encontrado" });
    const result = await enrichAttendance(updated[0]);
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar asistencia" });
  }
});

export default router;
