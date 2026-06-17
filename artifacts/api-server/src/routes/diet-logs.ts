import { Router } from "express";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";
import { db, dietLogsTable } from "@workspace/db";
import {
  ListDietLogsQueryParams,
  UpsertDietLogBody,
  GetDietLogParams,
  GetMonthSummaryQueryParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

function computeDayStatus(
  breakfast: string | null | undefined,
  lunch: string | null | undefined,
  dinner: string | null | undefined,
  snacks: string | null | undefined
): "clean" | "cheat" | "moderate" | "empty" {
  const meals = [breakfast, lunch, dinner, snacks].filter(Boolean);
  if (meals.length === 0) return "empty";
  if (meals.includes("junk")) return "cheat";
  if (meals.includes("moderate")) return "moderate";
  return "clean";
}

router.get("/diet-logs", async (req, res) => {
  const parsed = ListDietLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { year, month } = parsed.data;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const logs = await db
    .select()
    .from(dietLogsTable)
    .where(and(gte(dietLogsTable.date, startDate), lte(dietLogsTable.date, endDate)));

  res.json(logs);
});

router.post("/diet-logs", async (req, res) => {
  const parsed = UpsertDietLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const data = parsed.data;
  const dayStatus = computeDayStatus(
    data.breakfastType,
    data.lunchType,
    data.dinnerType,
    data.snacksType
  );

  const [log] = await db
    .insert(dietLogsTable)
    .values({
      date: data.date,
      breakfastType: data.breakfastType ?? null,
      lunchType: data.lunchType ?? null,
      dinnerType: data.dinnerType ?? null,
      snacksType: data.snacksType ?? null,
      waterCups: data.waterCups ?? 0,
      calories: data.calories ?? null,
      note: data.note ?? null,
      dayStatus,
    })
    .onConflictDoUpdate({
      target: dietLogsTable.date,
      set: {
        breakfastType: data.breakfastType ?? null,
        lunchType: data.lunchType ?? null,
        dinnerType: data.dinnerType ?? null,
        snacksType: data.snacksType ?? null,
        waterCups: data.waterCups ?? 0,
        calories: data.calories ?? null,
        note: data.note ?? null,
        dayStatus,
        updatedAt: new Date(),
      },
    })
    .returning();

  req.log.info({ date: data.date, dayStatus }, "Diet log upserted");
  res.json(log);
});

router.get("/diet-logs/summary", async (req, res) => {
  const parsed = GetMonthSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { year, month } = parsed.data;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const logs = await db
    .select()
    .from(dietLogsTable)
    .where(and(gte(dietLogsTable.date, startDate), lte(dietLogsTable.date, endDate)));

  const totalLogged = logs.filter((l) => l.dayStatus !== "empty").length;
  const cleanDays = logs.filter((l) => l.dayStatus === "clean").length;
  const cheatDays = logs.filter((l) => l.dayStatus === "cheat").length;
  const moderateDays = logs.filter((l) => l.dayStatus === "moderate").length;

  const today = new Date().toISOString().split("T")[0];
  const sortedByDate = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak = 0;
  const todayOrEarlier = sortedByDate.filter((l) => l.date <= today).reverse();
  for (const log of todayOrEarlier) {
    if (log.dayStatus === "clean") currentStreak++;
    else break;
  }

  const withWater = logs.filter((l) => l.dayStatus !== "empty");
  const avgWaterCups = withWater.length
    ? withWater.reduce((sum, l) => sum + l.waterCups, 0) / withWater.length
    : 0;

  const withCalories = logs.filter((l) => l.calories !== null);
  const avgCalories = withCalories.length
    ? withCalories.reduce((sum, l) => sum + (l.calories ?? 0), 0) / withCalories.length
    : null;

  res.json({
    year,
    month,
    totalLogged,
    cleanDays,
    cheatDays,
    moderateDays,
    currentStreak,
    avgWaterCups: Math.round(avgWaterCups * 10) / 10,
    avgCalories: avgCalories !== null ? Math.round(avgCalories) : null,
  });
});

router.get("/diet-logs/:date", async (req, res) => {
  const parsed = GetDietLogParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }

  const [log] = await db
    .select()
    .from(dietLogsTable)
    .where(eq(dietLogsTable.date, parsed.data.date));

  if (!log) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(log);
});

export default router;
