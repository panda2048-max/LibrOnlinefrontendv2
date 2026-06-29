import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function enrichAnnouncement(a: typeof announcementsTable.$inferSelect) {
  const author = await db.select().from(usersTable).where(eq(usersTable.id, a.authorId)).limit(1);
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    type: a.type,
    createdAt: a.createdAt.toISOString(),
    authorName: author[0] ? `${author[0].nombre} ${author[0].apellido}` : "Administración",
    eventDate: a.eventDate ? a.eventDate.toISOString() : null,
  };
}

router.get("/announcements", async (req, res) => {
  try {
    const records = await db.select().from(announcementsTable);
    const result = await Promise.all(records.map(enrichAnnouncement));
    return res.json(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/announcements", async (req, res) => {
  try {
    const { title, content, type, authorId, eventDate } = req.body;
    const inserted = await db.insert(announcementsTable).values({
      title, content, type, authorId,
      eventDate: eventDate ? new Date(eventDate) : null,
    }).returning();
    const result = await enrichAnnouncement(inserted[0]);
    return res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear anuncio" });
  }
});

router.patch("/announcements/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, type, eventDate } = req.body;
    const updated = await db.update(announcementsTable).set({
      ...(title && { title }),
      ...(content && { content }),
      ...(type && { type }),
      ...(eventDate !== undefined && { eventDate: eventDate ? new Date(eventDate) : null }),
    }).where(eq(announcementsTable.id, id)).returning();
    if (!updated[0]) return res.status(404).json({ error: "Anuncio no encontrado" });
    const result = await enrichAnnouncement(updated[0]);
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar anuncio" });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  return res.json({ message: "Anuncio eliminado" });
});

export default router;
