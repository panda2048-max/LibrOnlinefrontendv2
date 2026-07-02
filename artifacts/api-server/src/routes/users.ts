import { Router } from "express";
import * as java from "../lib/javaClient";
import { fetchUserIndex, fetchUserById, splitName, ensureDocenteForUser } from "../lib/javaMappers";

const router = Router();

router.get("/users", async (req, res) => {
  try {
    const { role } = req.query as { role?: string };
    const { users } = await fetchUserIndex();
    return res.json(role ? users.filter((u) => u.role === role) : users);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { rut, nombre, apellido, email, role, password, telefono } = req.body;
    const [primer_nombre, segundo_nombre] = splitName(nombre);
    const [ap_paterno, ap_materno] = splitName(apellido);
    const usuario = await java.createUsuario({
      runUsuario: rut,
      primer_nombre,
      segundo_nombre,
      ap_paterno,
      ap_materno,
      password: password || "password123",
      telefono: telefono || "-",
    });
    await java.createRol({ id_usuario: usuario.id_usuarios, tipo_rol: role });
    await java.createEmail({ id_usuario: usuario.id_usuarios, email });
    if (role === "profesor") {
      await ensureDocenteForUser(usuario.id_usuarios, `${nombre} ${apellido}`.trim()).catch((e) => {
        req.log.warn({ err: e }, "Gestion_Cursos unavailable — docente record skipped, will be created on next course assignment");
      });
    }
    const user = await fetchUserById(usuario.id_usuarios);
    return res.status(201).json(user);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear usuario" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await fetchUserById(id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json(user);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, apellido, email, telefono, role } = req.body;

    const current = await java.getUsuario(id).catch(() => null);
    if (!current) return res.status(404).json({ error: "Usuario no encontrado" });

    const [primer_nombre, segundo_nombre] = nombre ? splitName(nombre) : [current.primer_nombre, current.segundo_nombre];
    const [ap_paterno, ap_materno] = apellido ? splitName(apellido) : [current.ap_paterno, current.ap_materno];
    await java.updateUsuario({
      id_usuario: id,
      runUsuario: current.runUsuario,
      primer_nombre,
      segundo_nombre,
      ap_paterno,
      ap_materno,
      password: current.password,
      telefono: telefono !== undefined ? telefono : current.telefono,
    });

    if (email !== undefined) {
      const emails = await java.listEmails();
      const existing = emails.find((e) => e.usuarios?.id_usuarios === id);
      if (existing) await java.updateEmail({ id_email: existing.id_email, email });
      else await java.createEmail({ id_usuario: id, email });
    }

    if (role) {
      const roles = await java.listRoles();
      const existing = roles.find((r) => r.usuarios?.id_usuarios === id);
      if (existing) await java.updateRol({ id_rol: existing.id_rol, tipo_rol: role });
      else await java.createRol({ id_usuario: id, tipo_rol: role });
      if (role === "profesor") {
        await ensureDocenteForUser(id, `${primer_nombre} ${ap_paterno}`.trim()).catch((e) => {
          req.log.warn({ err: e }, "Gestion_Cursos unavailable — docente record skipped");
        });
      }
    }

    const user = await fetchUserById(id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json(user);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await java.deleteUsuario(id);
    return res.json({ message: "Usuario eliminado" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

export default router;
