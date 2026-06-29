import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { rut, password } = req.body;
    const user = await db.select().from(usersTable).where(eq(usersTable.rut, rut)).limit(1);
    if (!user[0] || user[0].password !== password) {
      return res.status(401).json({ error: "RUT o contraseña incorrectos" });
    }
    const { password: _, ...safeUser } = user[0];
    return res.json({
      user: {
        ...safeUser,
        createdAt: safeUser.createdAt.toISOString(),
      },
      token: `token_${safeUser.id}`,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No autorizado" });
  const userId = parseInt(authHeader.replace("Bearer token_", ""));
  if (isNaN(userId)) return res.status(401).json({ error: "Token inválido" });
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) return res.status(404).json({ error: "Usuario no encontrado" });
  const { password: _, ...safeUser } = user[0];
  return res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
});

router.post("/auth/logout", async (req, res) => {
  return res.json({ message: "Sesión cerrada" });
});

export default router;
