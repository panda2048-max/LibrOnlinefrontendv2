import { Router } from "express";
import { db } from "@workspace/db";
import { gradesTable, usersTable, coursesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function enrichGrade(g: typeof gradesTable.$inferSelect) {
  const student = await db.select().from(usersTable).where(eq(usersTable.id, g.studentId)).limit(1);
  const course = await db.select().from(coursesTable).where(eq(coursesTable.id, g.courseId)).limit(1);
  return {
    id: g.id,
    studentId: g.studentId,
    studentName: student[0] ? `${student[0].nombre} ${student[0].apellido}` : "Desconocido",
    studentRut: student[0]?.rut || "",
    courseId: g.courseId,
    courseName: course[0]?.nombre || "Desconocido",
    evaluationName: g.evaluationName,
    value: g.value,
    createdAt: g.createdAt.toISOString(),
  };
}

router.get("/grades", async (req, res) => {
  try {
    const { studentId, courseId, rut } = req.query as Record<string, string>;
    let grades = await db.select().from(gradesTable);

    if (studentId) grades = grades.filter(g => g.studentId === parseInt(studentId));
    if (courseId) grades = grades.filter(g => g.courseId === parseInt(courseId));
    if (rut) {
      const student = await db.select().from(usersTable).where(eq(usersTable.rut, rut)).limit(1);
      if (student[0]) grades = grades.filter(g => g.studentId === student[0].id);
      else grades = [];
    }

    const result = await Promise.all(grades.map(enrichGrade));
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/grades", async (req, res) => {
  try {
    const { studentId, courseId, evaluationName, value } = req.body;
    const inserted = await db.insert(gradesTable).values({ studentId, courseId, evaluationName, value }).returning();
    const result = await enrichGrade(inserted[0]);
    return res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear nota" });
  }
});

router.patch("/grades/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { evaluationName, value } = req.body;
    const updated = await db.update(gradesTable).set({
      ...(evaluationName && { evaluationName }),
      ...(value !== undefined && { value }),
    }).where(eq(gradesTable.id, id)).returning();
    if (!updated[0]) return res.status(404).json({ error: "Nota no encontrada" });
    const result = await enrichGrade(updated[0]);
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar nota" });
  }
});

router.delete("/grades/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(gradesTable).where(eq(gradesTable.id, id));
  return res.json({ message: "Nota eliminada" });
});

router.get("/grades/average/:studentId/:courseId", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courseId = parseInt(req.params.courseId);
    const grades = await db.select().from(gradesTable).where(
      and(eq(gradesTable.studentId, studentId), eq(gradesTable.courseId, courseId))
    );
    const total = grades.length;
    const avg = total > 0 ? grades.reduce((sum, g) => sum + g.value, 0) / total : 0;
    return res.json({ studentId, courseId, average: Math.round(avg * 10) / 10, totalGrades: total });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

export default router;
