import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { fetchUserIndex, type User } from "../lib/javaMappers";

const router = Router();

function enrichAnnouncement(a: typeof announcementsTable.$inferSelect, userById: Map<number, User>) {
  const author = userById.get(a.authorId);
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    type: a.type,
    createdAt: a.createdAt.toISOString(),
    authorName: author ? `${author.nombre} ${author.apellido}` : "Administración",
    eventDate: a.eventDate ? a.eventDate.toISOString() : null,
  };
}

router.get("/announcements", async (req, res) => {
  try {
    const records = await db.select().from(announcementsTable);
    const { byId: userById } = await fetchUserIndex();
    const result = records.map((a) => enrichAnnouncement(a, userById));
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
    const { byId: userById } = await fetchUserIndex();
    return res.status(201).json(enrichAnnouncement(inserted[0], userById));
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
    const { byId: userById } = await fetchUserIndex();
    return res.json(enrichAnnouncement(updated[0], userById));
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
