import React, { useEffect, useRef, useState } from "react";
import {
  useGetDietLog,
  useUpsertDietLog,
  useGetProfile,
  useEstimateCalories,
  getGetDietLogQueryKey,
  getListDietLogsQueryKey,
  getGetMonthSummaryQueryKey,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Save, AlertTriangle, Wand2, Loader2, RotateCcw, Dumbbell } from "lucide-react";
import type { DietLogInput } from "@workspace/api-client-react";

interface DayDetailPanelProps {
  date: string;
  onClose: () => void;
  onMarkCheatDay: () => void;
  currentYear: number;
  currentMonth: number;
}

type MealKey = "breakfast" | "lunch" | "dinner" | "snacks";
type MealCalories = Record<MealKey, number>;
type MealProtein = Record<MealKey, number>;
type MealType = "healthy" | "moderate" | "junk" | null;

const MEALS: MealKey[] = ["breakfast", "lunch", "dinner", "snacks"];

const MEAL_TYPE_COLORS: Record<string, string> = {
  healthy: "data-[state=on]:bg-primary data-[state=on]:text-[hsl(225_25%_7%)]",
  moderate: "data-[state=on]:bg-[hsl(38_95%_55%)] data-[state=on]:text-[hsl(225_25%_7%)]",
  junk: "data-[state=on]:bg-destructive data-[state=on]:text-white",
};

const CATEGORY_BADGE: Record<string, string> = {
  healthy: "bg-primary/15 text-primary border border-primary/30",
  moderate: "bg-[hsl(38_95%_55%)]/15 text-[hsl(38_95%_55%)] border border-[hsl(38_95%_55%)]/30",
  junk: "bg-destructive/15 text-destructive border border-destructive/30",
};

export function DayDetailPanel({ date, onClose, onMarkCheatDay, currentYear, currentMonth }: DayDetailPanelProps) {
  const queryClient = useQueryClient();

  const { data: log, isLoading } = useGetDietLog(date, {
    query: { enabled: !!date, queryKey: getGetDietLogQueryKey(date) },
  });

  const { data: profile } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const { mutate: upsertLog, isPending } = useUpsertDietLog();
  const { mutate: estimateCalories } = useEstimateCalories();

  const [formData, setFormData] = useState<DietLogInput>({ date });
  const [mealCalories, setMealCalories] = useState<MealCalories>({ breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
  const [mealProtein, setMealProtein] = useState<MealProtein>({ breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
  const [estimatingMeal, setEstimatingMeal] = useState<MealKey | null>(null);
  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (log && initializedForId.current !== date) {
      initializedForId.current = date;
      setFormData({
        date,
        breakfastType: log.breakfastType,
        lunchType: log.lunchType,
        dinnerType: log.dinnerType,
        snacksType: log.snacksType,
        breakfastFood: log.breakfastFood,
        lunchFood: log.lunchFood,
        dinnerFood: log.dinnerFood,
        snacksFood: log.snacksFood,
        waterCups: log.waterCups,
        calories: log.calories,
        protein: log.protein,
        note: log.note,
      });
      setMealCalories({ breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
      setMealProtein({ breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
    } else if (!log && !isLoading && initializedForId.current !== date) {
      initializedForId.current = date;
      setFormData({
        date,
        breakfastType: null, lunchType: null, dinnerType: null, snacksType: null,
        breakfastFood: null, lunchFood: null, dinnerFood: null, snacksFood: null,
        waterCups: 0, calories: null, protein: null, note: "",
      });
      setMealCalories({ breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
      setMealProtein({ breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
    }
  }, [log, date, isLoading]);

  const handleSave = () => {
    upsertLog(
      { data: formData },
      {
        onSuccess: (savedLog) => {
          queryClient.setQueryData(getGetDietLogQueryKey(date), savedLog);
          queryClient.invalidateQueries({ queryKey: getListDietLogsQueryKey({ year: currentYear, month: currentMonth }) });
          queryClient.invalidateQueries({ queryKey: getGetMonthSummaryQueryKey({ year: currentYear, month: currentMonth }) });
          onClose();
        },
      }
    );
  };

  const handleFoodChange = (meal: MealKey, value: string) => {
    setFormData((prev: DietLogInput) => ({ ...prev, [`${meal}Food`]: value || null }));
  };

  const handleMealTypeChange = (meal: MealKey, value: string) => {
    setFormData((prev: DietLogInput) => ({ ...prev, [`${meal}Type`]: (value || null) as MealType }));
  };

  const handleResetMeal = (meal: MealKey) => {
    const updatedCal = { ...mealCalories, [meal]: 0 };
    const updatedPro = { ...mealProtein, [meal]: 0 };
    setMealCalories(updatedCal);
    setMealProtein(updatedPro);
    setFormData((prev: DietLogInput) => ({
      ...prev,
      [`${meal}Food`]: null,
      [`${meal}Type`]: null,
      calories: Object.values(updatedCal).reduce((a, b) => a + b, 0) || null,
      protein: Object.values(updatedPro).reduce((a, b) => a + b, 0) || null,
    }));
  };

  const handleResetCalories = () => {
    setMealCalories({ breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
    setMealProtein({ breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
    setFormData((prev: DietLogInput) => ({ ...prev, calories: null, protein: null }));
  };

  const handleEstimate = (meal: MealKey) => {
    const foodKey = `${meal}Food` as keyof DietLogInput;
    const foodDescription = formData[foodKey] as string;
    if (!foodDescription?.trim()) return;

    setEstimatingMeal(meal);
    estimateCalories(
      { data: { foodDescription } },
      {
        onSuccess: (result) => {
          const updatedCal = { ...mealCalories, [meal]: result.estimatedCalories };
          const updatedPro = { ...mealProtein, [meal]: result.estimatedProteinG };
          setMealCalories(updatedCal);
          setMealProtein(updatedPro);
          const typeKey = `${meal}Type` as keyof DietLogInput;
          setFormData((prev: DietLogInput) => ({
            ...prev,
            [typeKey]: result.mealType,
            calories: Object.values(updatedCal).reduce((a, b) => a + b, 0),
            protein: Object.values(updatedPro).reduce((a, b) => a + b, 0),
          }));
          setEstimatingMeal(null);
        },
        onError: () => setEstimatingMeal(null),
      }
    );
  };

  if (isLoading || !profile) {
    return (
      <div className="p-8 flex flex-col gap-6 h-full">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
      </div>
    );
  }

  const dateObj = new Date(date + "T12:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const dailyGoal = profile.dailyCalorieGoal || 2000;
  const dailyProteinGoal = profile.dailyProteinGoal || 120;
  const currentCalories = formData.calories || 0;
  const currentProtein = formData.protein || 0;
  const progressPercent = Math.min((currentCalories / dailyGoal) * 100, 100);
  const proteinPercent = Math.min((currentProtein / dailyProteinGoal) * 100, 100);
  const isOverGoal = currentCalories > dailyGoal;
  const isNearGoal = currentCalories >= dailyGoal * 0.85 && !isOverGoal;
  const remaining = dailyGoal - currentCalories;
  const isProteinMet = currentProtein >= dailyProteinGoal;
  const isProteinNear = currentProtein >= dailyProteinGoal * 0.8 && !isProteinMet;

  const progressColor = isOverGoal
    ? "bg-destructive"
    : isNearGoal
    ? "bg-[hsl(38_95%_55%)]"
    : "bg-primary";
  const textColor = isOverGoal
    ? "text-destructive"
    : isNearGoal
    ? "text-[hsl(38_95%_55%)]"
    : "text-primary";
  const proteinBarColor = isProteinMet
    ? "bg-[hsl(262_80%_60%)]"
    : isProteinNear
    ? "bg-[hsl(262_70%_50%)]"
    : "bg-[hsl(262_60%_45%)]";
  const proteinTextColor = isProteinMet ? "text-[hsl(262_80%_70%)]" : "text-[hsl(262_60%_60%)]";

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between bg-background/40">
        <div>
          <h2 className="text-2xl font-serif text-primary">{formattedDate}</h2>
          {log?.dayStatus && log.dayStatus !== "empty" && (
            <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mt-0.5 block">
              Status:{" "}
              <span className={log.dayStatus === "clean" ? "text-primary" : log.dayStatus === "cheat" ? "text-destructive" : "text-[hsl(38_95%_55%)]"}>
                {log.dayStatus}
              </span>
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-muted-foreground">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Calorie + protein bars */}
      <div className="px-6 py-3 border-b border-border bg-background/20 space-y-3">
        {/* Calorie bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Calories
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold font-serif ${textColor}`}>
                {currentCalories.toLocaleString()}{" "}
                <span className="text-xs font-sans font-normal text-muted-foreground">/ {dailyGoal.toLocaleString()} kcal</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={handleResetCalories}
                title="Reset all meal calories and re-enter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs font-semibold ${textColor}`}>
              {isOverGoal
                ? `${(currentCalories - dailyGoal).toLocaleString()} kcal OVER limit`
                : `${remaining.toLocaleString()} kcal remaining`}
            </span>
            {isOverGoal && (
              <span className="text-xs font-bold text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Over budget!
              </span>
            )}
          </div>
        </div>

        {/* Protein bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Dumbbell className="w-3.5 h-3.5" />
              Protein
            </span>
            <span className={`text-sm font-bold font-serif ${proteinTextColor}`}>
              {currentProtein}g{" "}
              <span className="text-xs font-sans font-normal text-muted-foreground">/ {dailyProteinGoal}g goal</span>
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${proteinBarColor} transition-all duration-500 rounded-full`}
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          {isProteinMet && (
            <p className="text-xs font-semibold text-[hsl(262_80%_70%)] mt-0.5">Protein goal met! 💪</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Meals */}
        {MEALS.map((meal) => {
          const mealCal = mealCalories[meal];
          const mealPro = mealProtein[meal];
          const isEstimating = estimatingMeal === meal;
          const foodVal = (formData[`${meal}Food` as keyof DietLogInput] as string) || "";
          const typeVal = (formData[`${meal}Type` as keyof DietLogInput] as string) || "";

          const typeBadgeClass =
            typeVal === "healthy"
              ? "bg-primary/15 text-primary border border-primary/30"
              : typeVal === "moderate"
              ? "bg-[hsl(38_95%_55%)]/15 text-[hsl(38_95%_55%)] border border-[hsl(38_95%_55%)]/30"
              : typeVal === "junk"
              ? "bg-destructive/15 text-destructive border border-destructive/30"
              : "";

          return (
            <div key={meal} className="bg-background rounded-2xl border border-border p-4 space-y-3">
              {/* Meal header row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-serif capitalize text-primary font-semibold">{meal}</span>
                  {typeVal && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${typeBadgeClass}`}>
                      {typeVal}
                    </span>
                  )}
                  {mealCal > 0 && (
                    <span className="text-xs text-muted-foreground font-semibold">≈ {mealCal} kcal</span>
                  )}
                  {mealPro > 0 && (
                    <span className="text-xs text-[hsl(262_60%_60%)] font-semibold">{mealPro}g protein</span>
                  )}
                </div>
                <ToggleGroup
                  type="single"
                  value={typeVal}
                  onValueChange={(val) => handleMealTypeChange(meal, val)}
                  className="justify-end shrink-0"
                >
                  <ToggleGroupItem
                    value="healthy"
                    className={`border border-border rounded-full px-3 text-xs h-6 ${MEAL_TYPE_COLORS.healthy}`}
                  >
                    Healthy
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="moderate"
                    className={`border border-border rounded-full px-3 text-xs h-6 ${MEAL_TYPE_COLORS.moderate}`}
                  >
                    Moderate
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="junk"
                    className={`border border-border rounded-full px-3 text-xs h-6 ${MEAL_TYPE_COLORS.junk}`}
                  >
                    Junk
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Food input + estimate + reset buttons */}
              <div className="flex gap-2">
                <Textarea
                  value={foodVal}
                  onChange={(e) => handleFoodChange(meal, e.target.value)}
                  placeholder={`What did you eat for ${meal}? e.g. 2 eggs and roti`}
                  className="resize-none min-h-[56px] max-h-[80px] bg-card border-border text-sm"
                />
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    className="h-auto px-3 flex flex-col gap-1 text-xs border-border bg-card min-w-[56px] flex-1"
                    onClick={() => handleEstimate(meal)}
                    disabled={isEstimating || !foodVal.trim()}
                    title="Estimate calories from food description"
                  >
                    {isEstimating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    ) : (
                      <Wand2 className="w-4 h-4 text-accent" />
                    )}
                    <span className="text-[10px]">{isEstimating ? "..." : "Estimate"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-full border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/40"
                    onClick={() => handleResetMeal(meal)}
                    title="Clear this meal and re-enter"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Water */}
        <div className="bg-background rounded-2xl border border-border p-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
            Water Intake
          </Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-border bg-card h-9 w-9"
              onClick={() => setFormData((p: DietLogInput) => ({ ...p, waterCups: Math.max(0, (p.waterCups || 0) - 1) }))}
            >
              −
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif text-primary font-bold w-8 text-center">{formData.waterCups || 0}</span>
              <span className="text-sm text-muted-foreground">/ 8 cups</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="border-border bg-card h-9 w-9"
              onClick={() => setFormData((p: DietLogInput) => ({ ...p, waterCups: Math.min(8, (p.waterCups || 0) + 1) }))}
            >
              +
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden ml-2">
              <div
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${((formData.waterCups || 0) / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-background rounded-2xl border border-border p-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Daily Note
          </Label>
          <Textarea
            value={formData.note || ""}
            onChange={(e) => setFormData((p: DietLogInput) => ({ ...p, note: e.target.value }))}
            placeholder="How did you feel today?"
            className="resize-none min-h-[80px] bg-card border-border text-sm"
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-5 border-t border-border bg-background/20 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive bg-transparent"
          onClick={onMarkCheatDay}
        >
          <AlertTriangle className="w-4 h-4 mr-1.5" />
          Cheat Day
        </Button>
        <Button onClick={handleSave} disabled={isPending} className="flex-1">
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Log</>
          )}
        </Button>
      </div>
    </div>
  );
}
