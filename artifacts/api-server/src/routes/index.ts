import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import coursesRouter from "./courses";
import enrollmentsRouter from "./enrollments";
import scheduleRouter from "./schedule";
import gradesRouter from "./grades";
import attendanceRouter from "./attendance";
import annotationsRouter from "./annotations";
import meetingsRouter from "./meetings";
import announcementsRouter from "./announcements";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(coursesRouter);
router.use(enrollmentsRouter);
router.use(scheduleRouter);
router.use(gradesRouter);
router.use(attendanceRouter);
router.use(annotationsRouter);
router.use(meetingsRouter);
router.use(announcementsRouter);
router.use(dashboardRouter);

export default router;
