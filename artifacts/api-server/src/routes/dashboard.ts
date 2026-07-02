import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";
import { fetchUserIndex, fetchCourseIndex, fetchGradeContext, fetchMeetingContext, toGrade } from "../lib/javaMappers";
import * as java from "../lib/javaClient";

const router = Router();

router.get("/dashboard/student/:studentId", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const [enrollments, { byId: courseById }, { records: meetings }, announcements, { notas, userIndex, courseById: courseByIdGrades }] = await Promise.all([
      java.listCursoEstudiante({ studentId }),
      fetchCourseIndex(),
      fetchMeetingContext(),
      db.select().from(announcementsTable),
      fetchGradeContext(),
    ]);

    const enrolledCourseIds = enrollments.map((e) => e.id_curso);
    const enrolledCourses = enrolledCourseIds.map((id) => courseById.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof courseById.get>>[];

    const studentMeetings = meetings.filter((m) => m.id_usuarios === studentId);
    const grades = notas.map((n) => toGrade(n, userIndex, courseByIdGrades)).filter((g) => g.studentId === studentId);

    const gradesSummary = enrolledCourses.map((c) => {
      const courseGrades = grades.filter((g) => g.courseId === c.id);
      const avg = courseGrades.length > 0 ? courseGrades.reduce((s, g) => s + g.value, 0) / courseGrades.length : 0;
      return { courseId: c.id, courseName: c.nombre, average: Math.round(avg * 10) / 10 };
    });

    return res.json({
      totalCourses: enrolledCourses.length,
      upcomingMeetings: studentMeetings.filter((m) => m.estado === "pendiente").length,
      recentAnnouncements: announcements.length,
      gradesSummary: gradesSummary.filter((g) => g.average > 0),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/dashboard/teacher/:teacherId", async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const { courses } = await fetchCourseIndex();
    const { records: meetings } = await fetchMeetingContext();
    const { users } = await fetchUserIndex();
    const { notas } = await fetchGradeContext();

    const myCourses = courses.filter((c) => c.profesorId === teacherId);
    const teacherMeetings = meetings.filter((m) => m.id_usuario_2 === teacherId);
    const students = users.filter((u) => u.role === "alumno");

    return res.json({
      totalStudents: students.length,
      totalCourses: myCourses.length,
      pendingMeetings: teacherMeetings.filter((m) => m.estado === "pendiente").length,
      recentGrades: notas.length,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/dashboard/admin", async (req, res) => {
  try {
    const { users } = await fetchUserIndex();
    const { courses } = await fetchCourseIndex();
    const { records: meetings } = await fetchMeetingContext();
    const announcements = await db.select().from(announcementsTable);

    return res.json({
      totalAlumnos: users.filter((u) => u.role === "alumno").length,
      totalApoderados: users.filter((u) => u.role === "apoderado").length,
      totalProfesores: users.filter((u) => u.role === "profesor").length,
      totalInspectores: users.filter((u) => u.role === "inspector").length,
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
