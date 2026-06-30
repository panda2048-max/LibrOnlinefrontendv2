import { Router } from "express";
import * as java from "../lib/javaClient";
import { fetchUserById } from "../lib/javaMappers";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { rut, password } = req.body;
    let login;
    try {
      login = await java.loginUsuario({ runUsuario: rut, password });
    } catch (err) {
      if (err instanceof java.JavaApiError) {
        return res.status(401).json({ error: "RUT o contraseña incorrectos" });
      }
      throw err;
    }
    const user = await fetchUserById(login.id_usuarios);
    if (!user) return res.status(401).json({ error: "RUT o contraseña incorrectos" });
    return res.json({ user, token: `token_${user.id}` });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });
    const userId = parseInt(authHeader.replace("Bearer token_", ""));
    if (isNaN(userId)) return res.status(401).json({ error: "Token inválido" });
    const user = await fetchUserById(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json(user);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/auth/logout", async (req, res) => {
  return res.json({ message: "Sesión cerrada" });
});

export default router;
