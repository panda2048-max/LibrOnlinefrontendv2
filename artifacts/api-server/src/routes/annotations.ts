import { Router } from "express";
import * as java from "../lib/javaClient";
import { fetchAnnotationContext, toAnnotation } from "../lib/javaMappers";

const router = Router();

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/annotations", async (req, res) => {
  try {
    const { studentId, type } = req.query as Record<string, string>;
    const { records, userById } = await fetchAnnotationContext();
    let filtered = records;
    if (studentId) filtered = filtered.filter((r) => r.id_usuarios === parseInt(studentId));
    if (type) filtered = filtered.filter((r) => r.tipo === type);
    return res.json(filtered.map((r) => toAnnotation(r, userById)));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/annotations", async (req, res) => {
  try {
    const { studentId, inspectorId, type, description } = req.body;
    const created = await java.createAnotacion({
      tipo: type,
      descripcion: description,
      fechaCreacion: todayDate(),
      id_usuarios: studentId,
      id_inspector: inspectorId,
    });
    const { userById } = await fetchAnnotationContext();
    return res.status(201).json(toAnnotation(created, userById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear anotación" });
  }
});

router.patch("/annotations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type, description } = req.body;
    const existing = await java.getAnotacion(id).catch(() => null);
    if (!existing) return res.status(404).json({ error: "Anotación no encontrada" });
    const updated = await java.updateAnotacion(id, {
      id,
      tipo: type ?? existing.tipo,
      descripcion: description ?? existing.descripcion,
      id_inspector: existing.id_inspector,
    });
    const { userById } = await fetchAnnotationContext();
    return res.json(toAnnotation(updated, userById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar anotación" });
  }
});

router.delete("/annotations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await java.deleteAnotacion(id);
    return res.json({ message: "Anotación eliminada" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al eliminar anotación" });
  }
});

export default router;
