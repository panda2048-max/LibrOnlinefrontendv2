import { Router } from "express";
import fs from "fs";
import path from "path";
import { fetchUserIndex, type User } from "../lib/javaMappers";

const STORE_FILE = path.join(process.cwd(), "data", "announcements.json");

interface StoredAnnouncement {
  id: number;
  title: string;
  content: string;
  type: string;
  authorId: number;
  eventDate: string | null;
  createdAt: string;
}

function load(): StoredAnnouncement[] {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function save(items: StoredAnnouncement[]): void {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

function nextId(items: StoredAnnouncement[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

function enrich(a: StoredAnnouncement, userById: Map<number, User>) {
  const author = userById.get(a.authorId);
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    type: a.type,
    createdAt: a.createdAt,
    authorName: author ? `${author.nombre} ${author.apellido}` : "Administración",
    eventDate: a.eventDate ?? null,
  };
}

const router = Router();

router.get("/announcements", async (req, res) => {
  try {
    const items = load();
    const { byId: userById } = await fetchUserIndex().catch(() => ({ byId: new Map<number, User>() }));
    const result = items.map((a) => enrich(a, userById));
    return res.json(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/announcements", async (req, res) => {
  try {
    const { title, content, type, authorId, eventDate } = req.body;
    const items = load();
    const item: StoredAnnouncement = {
      id: nextId(items),
      title,
      content,
      type: type ?? "anuncio",
      authorId: authorId ?? 0,
      eventDate: eventDate ?? null,
      createdAt: new Date().toISOString(),
    };
    save([...items, item]);
    const { byId: userById } = await fetchUserIndex().catch(() => ({ byId: new Map<number, User>() }));
    return res.status(201).json(enrich(item, userById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear anuncio" });
  }
});

router.patch("/announcements/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, type, eventDate } = req.body;
    const items = load();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: "Anuncio no encontrado" });
    items[idx] = {
      ...items[idx],
      ...(title && { title }),
      ...(content && { content }),
      ...(type && { type }),
      ...(eventDate !== undefined && { eventDate: eventDate ?? null }),
    };
    save(items);
    const { byId: userById } = await fetchUserIndex().catch(() => ({ byId: new Map<number, User>() }));
    return res.json(enrich(items[idx], userById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar anuncio" });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    save(load().filter((i) => i.id !== id));
    return res.json({ message: "Anuncio eliminado" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al eliminar anuncio" });
  }
});

export default router;
