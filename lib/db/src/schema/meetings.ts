import { pgTable, serial, integer, text, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const meetingStatusEnum = pgEnum("meeting_status", ["pendiente", "confirmada", "cancelada"]);

export const meetingsTable = pgTable("meetings", {
  id: serial("id").primaryKey(),
  requestedById: integer("requested_by_id").notNull(),
  withUserId: integer("with_user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: meetingStatusEnum("status").notNull().default("pendiente"),
});

export const insertMeetingSchema = createInsertSchema(meetingsTable).omit({ id: true, status: true });
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetingsTable.$inferSelect;
