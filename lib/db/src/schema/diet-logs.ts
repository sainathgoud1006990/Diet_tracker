import { pgTable, serial, date, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mealTypeEnum = ["healthy", "moderate", "junk"] as const;
export type MealType = (typeof mealTypeEnum)[number] | null;

export const dayStatusEnum = ["clean", "cheat", "moderate", "empty"] as const;
export type DayStatus = (typeof dayStatusEnum)[number];

export const dietLogsTable = pgTable("diet_logs", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  breakfastType: text("breakfast_type").$type<MealType>(),
  lunchType: text("lunch_type").$type<MealType>(),
  dinnerType: text("dinner_type").$type<MealType>(),
  snacksType: text("snacks_type").$type<MealType>(),
  waterCups: integer("water_cups").notNull().default(0),
  calories: integer("calories"),
  note: text("note"),
  dayStatus: text("day_status").$type<DayStatus>().notNull().default("empty"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDietLogSchema = createInsertSchema(dietLogsTable).omit({
  id: true,
  dayStatus: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDietLog = z.infer<typeof insertDietLogSchema>;
export type DietLog = typeof dietLogsTable.$inferSelect;
