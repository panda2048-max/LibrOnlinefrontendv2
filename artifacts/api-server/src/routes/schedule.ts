import { Router } from "express";
import { db } from "@workspace/db";
import { scheduleTable, coursesTable, usersTable, gradesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/schedule", async (req, res) => {
  try {
    const { studentId, teacherId, courseId } = req.query as Record<string, string>;
    let schedules = await db.select().from(scheduleTable);

    if (courseId) {
      schedules = schedules.filter(s => s.courseId === parseInt(courseId));
    }

    const result = await Promise.all(schedules.map(async (s) => {
      const course = await db.select().from(coursesTable).where(eq(coursesTable.id, s.courseId)).limit(1);
      if (!course[0]) return null;
      if (teacherId && course[0].profesorId !== parseInt(teacherId)) return null;
      const teacher = await db.select().from(usersTable).where(eq(usersTable.id, course[0].profesorId)).limit(1);
      return {
        id: s.id,
        courseId: s.courseId,
        courseName: course[0].nombre,
        teacherName: teacher[0] ? `${teacher[0].nombre} ${teacher[0].apellido}` : "Sin asignar",
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        classroom: s.classroom,
      };
    }));

    return res.json(result.filter(Boolean));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/schedule", async (req, res) => {
  try {
    const { courseId, dayOfWeek, startTime, endTime, classroom } = req.body;
    const inserted = await db.insert(scheduleTable).values({ courseId, dayOfWeek, startTime, endTime, classroom }).returning();
    const course = await db.select().from(coursesTable).where(eq(coursesTable.id, inserted[0].courseId)).limit(1);
    const teacher = course[0] ? await db.select().from(usersTable).where(eq(usersTable.id, course[0].profesorId)).limit(1) : [];
    return res.status(201).json({
      ...inserted[0],
      courseName: course[0]?.nombre || "Desconocido",
      teacherName: teacher[0] ? `${teacher[0].nombre} ${teacher[0].apellido}` : "Sin asignar",
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
    const course = await db.select().from(coursesTable).where(eq(coursesTable.id, updated[0].courseId)).limit(1);
    const teacher = course[0] ? await db.select().from(usersTable).where(eq(usersTable.id, course[0].profesorId)).limit(1) : [];
    return res.json({
      ...updated[0],
      courseName: course[0]?.nombre || "Desconocido",
      teacherName: teacher[0] ? `${teacher[0].nombre} ${teacher[0].apellido}` : "Sin asignar",
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al actualizar horario" });
  }
});

export default router;
