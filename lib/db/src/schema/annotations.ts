import { pgTable, serial, integer, text, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const annotationTypeEnum = pgEnum("annotation_type", ["positiva", "negativa"]);

export const annotationsTable = pgTable("annotations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  inspectorId: integer("inspector_id").notNull(),
  type: annotationTypeEnum("type").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const insertAnnotationSchema = createInsertSchema(annotationsTable).omit({ id: true, date: true });
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export type Annotation = typeof annotationsTable.$inferSelect;
