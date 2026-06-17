import React, { useEffect, useRef, useState } from "react";
import { useGetDietLog, useUpsertDietLog, getGetDietLogQueryKey, getListDietLogsQueryKey, getGetMonthSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Save, AlertTriangle } from "lucide-react";
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

  const { mutate: upsertLog, isPending } = useUpsertDietLog();

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
        }
      }
    );
  };

  const handleMealChange = (meal: keyof DietLogInput, value: string) => {
    setFormData(prev => ({ ...prev, [meal]: value === "" ? null : value }));
  };

  if (isLoading) {
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

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-6 border-b flex items-center justify-between bg-sidebar/50">
        <div>
          <h2 className="text-2xl font-serif text-primary">{formattedDate}</h2>
          {log?.dayStatus && (
            <span className="text-sm uppercase tracking-widest font-semibold text-muted-foreground mt-1 block">
              Status: <span className="text-primary">{log.dayStatus}</span>
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full md:hidden">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Meals */}
        <div className="space-y-6">
          {(['breakfastType', 'lunchType', 'dinnerType', 'snacksType'] as const).map((meal) => (
            <div key={meal} className="space-y-3">
              <Label className="text-lg font-serif capitalize text-primary">
                {meal.replace('Type', '')}
              </Label>
              <ToggleGroup 
                type="single" 
                value={formData[meal] || ""} 
                onValueChange={(val) => handleMealChange(meal, val)}
                className="justify-start"
              >
                <ToggleGroupItem value="healthy" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border rounded-full px-6">
                  Healthy
                </ToggleGroupItem>
                <ToggleGroupItem value="moderate" className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground border rounded-full px-6">
                  Moderate
                </ToggleGroupItem>
                <ToggleGroupItem value="junk" className="data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground border rounded-full px-6">
                  Junk
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Water (Cups)</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setFormData(p => ({ ...p, waterCups: Math.max(0, (p.waterCups || 0) - 1) }))}
              >-</Button>
              <span className="text-xl font-serif w-8 text-center">{formData.waterCups || 0}</span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setFormData(p => ({ ...p, waterCups: Math.min(8, (p.waterCups || 0) + 1) }))}
              >+</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Calories</Label>
            <Input 
              type="number" 
              value={formData.calories || ""} 
              onChange={(e) => setFormData(p => ({ ...p, calories: e.target.value ? Number(e.target.value) : null }))}
              placeholder="e.g. 2000"
              className="text-lg font-serif"
            />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Daily Note</Label>
          <Textarea 
            value={formData.note || ""} 
            onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))}
            placeholder="How did you feel today?"
            className="resize-none min-h-[100px]"
          />
        </div>
      </div>

      <div className="p-6 border-t bg-sidebar/50 flex items-center justify-between gap-4">
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onMarkCheatDay}>
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
