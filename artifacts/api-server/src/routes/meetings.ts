import { Router } from "express";
import * as java from "../lib/javaClient";
import { fetchMeetingContext, toMeeting, splitDateTime, defaultSalaIdForReunion } from "../lib/javaMappers";

const router = Router();

router.get("/meetings", async (req, res) => {
  try {
    const { requestedById, withUserId } = req.query as Record<string, string>;
    const { records, userById } = await fetchMeetingContext();
    let filtered = records;
    if (requestedById) filtered = filtered.filter((r) => r.id_usuarios === parseInt(requestedById));
    if (withUserId) filtered = filtered.filter((r) => r.id_usuario_2 === parseInt(withUserId));
    return res.json(filtered.map((r) => toMeeting(r, userById)));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/meetings", async (req, res) => {
  try {
    const { requestedById, withUserId, title, scheduledAt } = req.body;
    const { fecha, hora_inicio, hora_fin } = splitDateTime(scheduledAt);
    const id_sala = await defaultSalaIdForReunion();
    const created = await java.createReunion({
      fecha,
      hora_inicio,
      hora_fin,
      asunto: title,
      estado: "pendiente",
      id_usuarios: requestedById,
      id_usuario_2: withUserId,
      id_sala,
    });
    const { userById } = await fetchMeetingContext();
    return res.status(201).json(toMeeting(created, userById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear reunión" });
  }
});

router.patch("/meetings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, scheduledAt, status } = req.body;
    const existing = await java.getReunion(id).catch(() => null);
    if (!existing) return res.status(404).json({ error: "Reunión no encontrada" });

    const time = scheduledAt
      ? splitDateTime(scheduledAt)
      : { fecha: existing.fecha, hora_inicio: existing.hora_inicio, hora_fin: existing.hora_fin };

    const updated = await java.updateReunion({
      id_reunion: id,
      fecha: time.fecha,
      hora_inicio: time.hora_inicio,
      hora_fin: time.hora_fin,
      asunto: title ?? existing.asunto,
      estado: status ?? existing.estado,
      id_usuario_2: existing.id_usuario_2,
    });
    const { userById } = await fetchMeetingContext();
    return res.json(toMeeting(updated, userById));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar reunión" });
  }
});

router.delete("/meetings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await java.deleteReunion(id);
    return res.json({ message: "Reunión eliminada" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al eliminar reunión" });
  }
});

export default router;
