import { Router } from "express";
import { db, userProfilesTable } from "@workspace/db";
import { UpsertProfileBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

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
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.375;
  return Math.round(bmr * multiplier);
}

function computeDailyProteinGoal(weightKg: number): number {
  return Math.round(weightKg * 1.6);
}

router.get("/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, req.user.id))
    .limit(1);
  if (!profile) {
    res.status(404).json({ error: "No profile found" });
    return;
  }
  res.json(profile);
});

router.post("/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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
  const dailyProteinGoal = computeDailyProteinGoal(weightKg);

  const [profile] = await db
    .insert(userProfilesTable)
    .values({
      userId: req.user.id,
      weightKg,
      heightCm,
      age,
      gender,
      activityLevel,
      dailyCalorieGoal,
      dailyProteinGoal,
    })
    .onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: {
        weightKg,
        heightCm,
        age,
        gender,
        activityLevel,
        dailyCalorieGoal,
        dailyProteinGoal,
        updatedAt: new Date(),
      },
    })
    .returning();

  req.log.info({ dailyCalorieGoal, dailyProteinGoal }, "Profile upserted");
  res.json(profile);
});

export default router;
