import { Router } from "express";
import { db } from "@workspace/db";
import { meetingsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function enrichMeeting(m: typeof meetingsTable.$inferSelect) {
  const requester = await db.select().from(usersTable).where(eq(usersTable.id, m.requestedById)).limit(1);
  const withUser = await db.select().from(usersTable).where(eq(usersTable.id, m.withUserId)).limit(1);
  return {
    id: m.id,
    requestedById: m.requestedById,
    requestedByName: requester[0] ? `${requester[0].nombre} ${requester[0].apellido}` : "Desconocido",
    withUserId: m.withUserId,
    withUserName: withUser[0] ? `${withUser[0].nombre} ${withUser[0].apellido}` : "Desconocido",
    title: m.title,
    description: m.description,
    scheduledAt: m.scheduledAt.toISOString(),
    status: m.status,
  };
}

router.get("/meetings", async (req, res) => {
  try {
    const { requestedById, withUserId } = req.query as Record<string, string>;
    let records = await db.select().from(meetingsTable);
    if (requestedById) records = records.filter(r => r.requestedById === parseInt(requestedById));
    if (withUserId) records = records.filter(r => r.withUserId === parseInt(withUserId));
    const result = await Promise.all(records.map(enrichMeeting));
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/meetings", async (req, res) => {
  try {
    const { requestedById, withUserId, title, description, scheduledAt } = req.body;
    const inserted = await db.insert(meetingsTable).values({
      requestedById, withUserId, title, description,
      scheduledAt: new Date(scheduledAt),
    }).returning();
    const result = await enrichMeeting(inserted[0]);
    return res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear reunión" });
  }
});

router.patch("/meetings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, scheduledAt, status } = req.body;
    const updated = await db.update(meetingsTable).set({
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      ...(status && { status }),
    }).where(eq(meetingsTable.id, id)).returning();
    if (!updated[0]) return res.status(404).json({ error: "Reunión no encontrada" });
    const result = await enrichMeeting(updated[0]);
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar reunión" });
  }
});

router.delete("/meetings/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(meetingsTable).where(eq(meetingsTable.id, id));
  return res.json({ message: "Reunión eliminada" });
});

export default router;
