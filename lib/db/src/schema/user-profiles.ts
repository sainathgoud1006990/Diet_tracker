import { pgTable, serial, real, integer, text, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityLevelEnum = ["sedentary", "light", "moderate", "active"] as const;
export const genderEnum = ["male", "female"] as const;

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  weightKg: real("weight_kg").notNull(),
  heightCm: real("height_cm").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").$type<"male" | "female">().notNull(),
  activityLevel: text("activity_level").$type<"sedentary" | "light" | "moderate" | "active">().notNull(),
  dailyCalorieGoal: integer("daily_calorie_goal").notNull(),
  dailyProteinGoal: integer("daily_protein_goal").notNull().default(120),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("user_profiles_user_id_idx").on(table.userId),
]);

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({
  id: true,
  dailyCalorieGoal: true,
  dailyProteinGoal: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
