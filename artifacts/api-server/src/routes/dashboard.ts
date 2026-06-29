import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, coursesTable, gradesTable, meetingsTable, announcementsTable,
  annotationsTable,
} from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

const router = Router();

router.get("/dashboard/student/:studentId", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courses = await db.select().from(coursesTable);
    const meetings = await db.select().from(meetingsTable).where(eq(meetingsTable.requestedById, studentId));
    const announcements = await db.select().from(announcementsTable);

    const gradesSummary = await Promise.all(courses.map(async (c) => {
      const grades = await db.select().from(gradesTable).where(
        and(eq(gradesTable.studentId, studentId), eq(gradesTable.courseId, c.id))
      );
      const avg = grades.length > 0 ? grades.reduce((s, g) => s + g.value, 0) / grades.length : 0;
      return { courseId: c.id, courseName: c.nombre, average: Math.round(avg * 10) / 10 };
    }));

    return res.json({
      totalCourses: courses.length,
      upcomingMeetings: meetings.filter(m => m.status === "pendiente").length,
      recentAnnouncements: announcements.length,
      gradesSummary: gradesSummary.filter(g => g.average > 0),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/dashboard/teacher/:teacherId", async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const myCourses = await db.select().from(coursesTable).where(eq(coursesTable.profesorId, teacherId));
    const meetings = await db.select().from(meetingsTable).where(eq(meetingsTable.withUserId, teacherId));
    const students = await db.select().from(usersTable).where(eq(usersTable.role, "alumno"));
    const recentGrades = await db.select().from(gradesTable);

    return res.json({
      totalStudents: students.length,
      totalCourses: myCourses.length,
      pendingMeetings: meetings.filter(m => m.status === "pendiente").length,
      recentGrades: recentGrades.length,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/dashboard/admin", async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    const courses = await db.select().from(coursesTable);
    const meetings = await db.select().from(meetingsTable);
    const announcements = await db.select().from(announcementsTable);

    return res.json({
      totalAlumnos: users.filter(u => u.role === "alumno").length,
      totalApoderados: users.filter(u => u.role === "apoderado").length,
      totalProfesores: users.filter(u => u.role === "profesor").length,
      totalInspectores: users.filter(u => u.role === "inspector").length,
      totalMeetings: meetings.length,
      totalAnnouncements: announcements.length,
      totalCourses: courses.length,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

export default router;
