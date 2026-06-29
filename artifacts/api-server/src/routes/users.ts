import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/users", async (req, res) => {
  try {
    const { role } = req.query as { role?: string };
    let users;
    if (role) {
      users = await db.select().from(usersTable).where(eq(usersTable.role, role as any));
    } else {
      users = await db.select().from(usersTable);
    }
    return res.json(users.map(({ password: _, ...u }) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { rut, nombre, apellido, email, role, password, telefono, apoderadoId } = req.body;
    const inserted = await db.insert(usersTable).values({
      rut, nombre, apellido, email, role, password: password || "password123",
      telefono: telefono || null,
      apoderadoId: apoderadoId || 0,
    }).returning();
    const { password: _, ...safeUser } = inserted[0];
    return res.status(201).json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear usuario" });
  }
});

router.get("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const user = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user[0]) return res.status(404).json({ error: "Usuario no encontrado" });
  const { password: _, ...safeUser } = user[0];
  return res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
});

router.patch("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, apellido, email, telefono, role } = req.body;
    const updated = await db.update(usersTable).set({
      ...(nombre && { nombre }),
      ...(apellido && { apellido }),
      ...(email && { email }),
      ...(telefono !== undefined && { telefono }),
      ...(role && { role }),
    }).where(eq(usersTable.id, id)).returning();
    if (!updated[0]) return res.status(404).json({ error: "Usuario no encontrado" });
    const { password: _, ...safeUser } = updated[0];
    return res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.json({ message: "Usuario eliminado" });
});

export default router;
