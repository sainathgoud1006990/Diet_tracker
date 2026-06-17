import React, { useEffect, useRef, useState } from "react";
import { 
  useGetDietLog, 
  useUpsertDietLog, 
  useGetProfile, 
  useEstimateCalories,
  getGetDietLogQueryKey, 
  getListDietLogsQueryKey, 
  getGetMonthSummaryQueryKey,
  getGetProfileQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { X, Save, AlertTriangle, Wand2 } from "lucide-react";
import { DietLogInput } from "@workspace/api-client-react/src/generated/api.schemas";

interface DayDetailPanelProps {
  date: string;
  onClose: () => void;
  onMarkCheatDay: () => void;
  currentYear: number;
  currentMonth: number;
}

export function DayDetailPanel({ date, onClose, onMarkCheatDay, currentYear, currentMonth }: DayDetailPanelProps) {
  const queryClient = useQueryClient();
  const { data: log, isLoading } = useGetDietLog(date, { 
    query: { 
      enabled: !!date, 
      queryKey: getGetDietLogQueryKey(date) 
    } 
  });
  
  const { data: profile } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });

  const { mutate: upsertLog, isPending } = useUpsertDietLog();
  const { mutate: estimateCalories, isPending: isEstimating } = useEstimateCalories();

  const [formData, setFormData] = useState<DietLogInput>({ date });
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
        note: log.note
      });
    } else if (!log && !isLoading && initializedForId.current !== date) {
      initializedForId.current = date;
      setFormData({
        date,
        breakfastType: null,
        lunchType: null,
        dinnerType: null,
        snacksType: null,
        breakfastFood: null,
        lunchFood: null,
        dinnerFood: null,
        snacksFood: null,
        waterCups: 0,
        calories: null,
        note: ""
      });
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
          onClose(); // Collapse panel after save
        }
      }
    );
  };

  const handleMealChange = (meal: keyof DietLogInput, value: string) => {
    setFormData(prev => ({ ...prev, [meal]: value === "" ? null : value }));
  };
  
  const handleFoodChange = (meal: string, value: string) => {
    setFormData(prev => ({ ...prev, [`${meal}Food`]: value }));
  };

  const handleEstimate = (meal: string) => {
    const foodDescription = formData[`${meal}Food` as keyof DietLogInput] as string;
    if (!foodDescription?.trim()) return;

    estimateCalories(
      { data: { foodDescription } },
      {
        onSuccess: (result) => {
          const currentTotal = formData.calories || 0;
          setFormData(prev => ({ 
            ...prev, 
            calories: currentTotal + result.estimatedCalories 
          }));
        }
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
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const dailyGoal = profile.dailyCalorieGoal || 2000;
  const currentCalories = formData.calories || 0;
  const progressPercent = Math.min((currentCalories / dailyGoal) * 100, 100);
  const isOverGoal = currentCalories > dailyGoal * 1.1;
  const isNearGoal = currentCalories > dailyGoal * 0.9 && !isOverGoal;
  
  const progressColor = isOverGoal ? 'bg-destructive' : isNearGoal ? 'bg-[hsl(38_95%_55%)]' : 'bg-primary';
  const textColor = isOverGoal ? 'text-destructive' : isNearGoal ? 'text-[hsl(38_95%_55%)]' : 'text-primary';

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-6 border-b border-border flex items-center justify-between bg-sidebar/50">
        <div>
          <h2 className="text-2xl font-serif text-primary">{formattedDate}</h2>
          {log?.dayStatus && (
            <span className="text-sm uppercase tracking-widest font-semibold text-muted-foreground mt-1 block">
              Status: <span className="text-primary">{log.dayStatus}</span>
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Meals */}
        <div className="space-y-8">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => (
            <div key={meal} className="space-y-3 bg-background p-4 rounded-2xl border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-serif capitalize text-primary">
                  {meal}
                </Label>
                <ToggleGroup 
                  type="single" 
                  value={formData[`${meal}Type` as keyof DietLogInput] as string || ""} 
                  onValueChange={(val) => handleMealChange(`${meal}Type` as keyof DietLogInput, val)}
                  className="justify-end scale-90 origin-right"
                >
                  <ToggleGroupItem value="healthy" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border border-border rounded-full px-4 text-xs h-7">
                    Healthy
                  </ToggleGroupItem>
                  <ToggleGroupItem value="moderate" className="data-[state=on]:bg-[hsl(38_95%_55%)] data-[state=on]:text-[#0f1117] border border-border rounded-full px-4 text-xs h-7">
                    Moderate
                  </ToggleGroupItem>
                  <ToggleGroupItem value="junk" className="data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground border border-border rounded-full px-4 text-xs h-7">
                    Junk
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="flex gap-2">
                <Textarea 
                  value={(formData[`${meal}Food` as keyof DietLogInput] as string) || ""} 
                  onChange={(e) => handleFoodChange(meal, e.target.value)}
                  placeholder="e.g. 2 scrambled eggs and avocado toast"
                  className="resize-none min-h-[60px] bg-card border-border"
                />
                <Button 
                  variant="secondary" 
                  className="h-auto px-3 flex flex-col gap-1 text-xs"
                  onClick={() => handleEstimate(meal)}
                  disabled={isEstimating || !formData[`${meal}Food` as keyof DietLogInput]}
                >
                  <Wand2 className="w-4 h-4 text-accent" />
                  Estimate
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Water (Cups)</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                className="border-border bg-background"
                onClick={() => setFormData(p => ({ ...p, waterCups: Math.max(0, (p.waterCups || 0) - 1) }))}
              >-</Button>
              <span className="text-xl font-serif w-8 text-center">{formData.waterCups || 0}</span>
              <Button 
                variant="outline" 
                size="icon"
                className="border-border bg-background"
                onClick={() => setFormData(p => ({ ...p, waterCups: Math.min(8, (p.waterCups || 0) + 1) }))}
              >+</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Calories</Label>
            <Input 
              type="number" 
              value={formData.calories || ""} 
              onChange={(e) => setFormData(p => ({ ...p, calories: e.target.value ? Number(e.target.value) : null }))}
              placeholder="e.g. 2000"
              className="text-lg font-serif bg-background border-border"
            />
          </div>
        </div>

        {/* Calorie Progress */}
        <div className="p-4 bg-background border border-border rounded-2xl space-y-3">
          <div className="flex justify-between items-end">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's Calories</Label>
            <div className="text-right">
              <span className={`text-xl font-serif font-bold ${textColor}`}>
                {currentCalories} <span className="text-sm font-sans font-normal text-muted-foreground">/ {dailyGoal} kcal</span>
              </span>
            </div>
          </div>
          <div className="h-3 w-full bg-card rounded-full overflow-hidden">
            <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs font-semibold">
            {isOverGoal ? (
              <span className="text-destructive">Over limit by {currentCalories - dailyGoal} kcal</span>
            ) : (
              <span className={textColor}>{dailyGoal - currentCalories} kcal remaining</span>
            )}
          </div>
          {isOverGoal && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-lg text-sm font-semibold text-center mt-2 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Over your daily limit!
            </div>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Daily Note</Label>
          <Textarea 
            value={formData.note || ""} 
            onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))}
            placeholder="How did you feel today?"
            className="resize-none min-h-[100px] bg-background border-border"
          />
        </div>
      </div>

      <div className="p-6 border-t border-border bg-sidebar/50 flex items-center justify-between gap-4">
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive bg-transparent" onClick={onMarkCheatDay}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Mark Cheat Day
        </Button>
        <Button onClick={handleSave} disabled={isPending} className="flex-1 md:flex-none">
          <Save className="w-4 h-4 mr-2" />
          {isPending ? "Saving..." : "Save Log"}
        </Button>
      </div>
    </div>
  );
}