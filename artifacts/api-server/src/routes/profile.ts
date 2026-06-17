import { Router } from "express";
import { db, userProfilesTable } from "@workspace/db";
import { UpsertProfileBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

function computeDailyCalorieGoal(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
  activityLevel: string
): number {
  // Mifflin-St Jeor BMR formula
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.375;
  return Math.round(bmr * multiplier);
}

router.get("/profile", async (req, res) => {
  const [profile] = await db.select().from(userProfilesTable).limit(1);
  if (!profile) {
    res.status(404).json({ error: "No profile found" });
    return;
  }
  res.json(profile);
});

router.post("/profile", async (req, res) => {
  const parsed = UpsertProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { weightKg, heightCm, age, gender, activityLevel } = parsed.data;
  const dailyCalorieGoal = computeDailyCalorieGoal(
    weightKg,
    heightCm,
    age,
    gender as "male" | "female",
    activityLevel
  );

  const [existing] = await db.select().from(userProfilesTable).limit(1);

  let profile;
  if (existing) {
    const [updated] = await db
      .update(userProfilesTable)
      .set({ weightKg, heightCm, age, gender, activityLevel, dailyCalorieGoal, updatedAt: new Date() })
      .returning();
    profile = updated;
  } else {
    const [created] = await db
      .insert(userProfilesTable)
      .values({ weightKg, heightCm, age, gender, activityLevel, dailyCalorieGoal })
      .returning();
    profile = created;
  }

  req.log.info({ dailyCalorieGoal }, "Profile upserted");
  res.json(profile);
});

export default router;
