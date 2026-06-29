import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/courses", async (req, res) => {
  try {
    const courses = await db.select().from(coursesTable);
    const result = await Promise.all(courses.map(async (c) => {
      const teacher = await db.select().from(usersTable).where(eq(usersTable.id, c.profesorId)).limit(1);
      return {
        ...c,
        profesorNombre: teacher[0] ? `${teacher[0].nombre} ${teacher[0].apellido}` : "Sin asignar",
      };
    }));
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.post("/courses", async (req, res) => {
  try {
    const { nombre, descripcion, profesorId } = req.body;
    const inserted = await db.insert(coursesTable).values({ nombre, descripcion, profesorId }).returning();
    const teacher = await db.select().from(usersTable).where(eq(usersTable.id, inserted[0].profesorId)).limit(1);
    return res.status(201).json({
      ...inserted[0],
      profesorNombre: teacher[0] ? `${teacher[0].nombre} ${teacher[0].apellido}` : "Sin asignar",
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Error al crear curso" });
  }
});

router.get("/courses/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const course = await db.select().from(coursesTable).where(eq(coursesTable.id, id)).limit(1);
  if (!course[0]) return res.status(404).json({ error: "Curso no encontrado" });
  const teacher = await db.select().from(usersTable).where(eq(usersTable.id, course[0].profesorId)).limit(1);
  return res.json({
    ...course[0],
    profesorNombre: teacher[0] ? `${teacher[0].nombre} ${teacher[0].apellido}` : "Sin asignar",
  });
});

export default router;
