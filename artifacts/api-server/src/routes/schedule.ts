import { Router } from "express";
import { db } from "@workspace/db";
import { scheduleTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { fetchCourseIndex } from "../lib/javaMappers";

const router = Router();

router.get("/schedule", async (req, res) => {
  try {
    const { studentId: _studentId, teacherId, courseId } = req.query as Record<string, string>;
    let schedules = await db.select().from(scheduleTable);

    if (courseId) {
      schedules = schedules.filter((s) => s.courseId === parseInt(courseId));
    }

    const { byId: courseById } = await fetchCourseIndex();
    const result = schedules
      .map((s) => {
        const course = courseById.get(s.courseId);
        if (!course) return null;
        if (teacherId && course.profesorId !== parseInt(teacherId)) return null;
        return {
          id: s.id,
          courseId: s.courseId,
          courseName: course.nombre,
          teacherName: course.profesorNombre,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          classroom: s.classroom,
        };
      })
      .filter(Boolean);

    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/schedule", async (req, res) => {
  try {
    const { courseId, dayOfWeek, startTime, endTime, classroom } = req.body;
    const inserted = await db.insert(scheduleTable).values({ courseId, dayOfWeek, startTime, endTime, classroom }).returning();
    const { byId: courseById } = await fetchCourseIndex();
    const course = courseById.get(inserted[0].courseId);
    return res.status(201).json({
      ...inserted[0],
      courseName: course?.nombre || "Desconocido",
      teacherName: course?.profesorNombre || "Sin asignar",
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear horario" });
  }
});

router.patch("/schedule/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { dayOfWeek, startTime, endTime, classroom } = req.body;
    const updated = await db.update(scheduleTable).set({
      ...(dayOfWeek && { dayOfWeek }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(classroom && { classroom }),
    }).where(eq(scheduleTable.id, id)).returning();
    if (!updated[0]) return res.status(404).json({ error: "Entrada no encontrada" });
    const { byId: courseById } = await fetchCourseIndex();
    const course = courseById.get(updated[0].courseId);
    return res.json({
      ...updated[0],
      courseName: course?.nombre || "Desconocido",
      teacherName: course?.profesorNombre || "Sin asignar",
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar horario" });
  }
});

export default router;
