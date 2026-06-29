import { Router } from "express";
import { db } from "@workspace/db";
import { annotationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function enrichAnnotation(a: typeof annotationsTable.$inferSelect) {
  const student = await db.select().from(usersTable).where(eq(usersTable.id, a.studentId)).limit(1);
  const inspector = await db.select().from(usersTable).where(eq(usersTable.id, a.inspectorId)).limit(1);
  return {
    id: a.id,
    studentId: a.studentId,
    studentName: student[0] ? `${student[0].nombre} ${student[0].apellido}` : "Desconocido",
    inspectorId: a.inspectorId,
    inspectorName: inspector[0] ? `${inspector[0].nombre} ${inspector[0].apellido}` : "Desconocido",
    type: a.type,
    description: a.description,
    date: a.date.toISOString(),
  };
}

router.get("/annotations", async (req, res) => {
  try {
    const { studentId, type } = req.query as Record<string, string>;
    let records = await db.select().from(annotationsTable);
    if (studentId) records = records.filter(r => r.studentId === parseInt(studentId));
    if (type) records = records.filter(r => r.type === type as any);
    const result = await Promise.all(records.map(enrichAnnotation));
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/annotations", async (req, res) => {
  try {
    const { studentId, inspectorId, type, description } = req.body;
    const inserted = await db.insert(annotationsTable).values({ studentId, inspectorId, type, description }).returning();
    const result = await enrichAnnotation(inserted[0]);
    return res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear anotación" });
  }
});

router.patch("/annotations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type, description } = req.body;
    const updated = await db.update(annotationsTable).set({
      ...(type && { type }),
      ...(description && { description }),
    }).where(eq(annotationsTable.id, id)).returning();
    if (!updated[0]) return res.status(404).json({ error: "Anotación no encontrada" });
    const result = await enrichAnnotation(updated[0]);
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar anotación" });
  }
});

router.delete("/annotations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(annotationsTable).where(eq(annotationsTable.id, id));
  return res.json({ message: "Anotación eliminada" });
});

export default router;
