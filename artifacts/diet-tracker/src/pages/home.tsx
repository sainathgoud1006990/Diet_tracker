import React, { useState, useEffect } from "react";
import { 
  useListDietLogs, 
  useGetMonthSummary, 
  useUpsertDietLog,
  getListDietLogsQueryKey,
  getGetMonthSummaryQueryKey,
  getGetDietLogQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDaysInMonth, getFirstDayOfMonth, formatDate, isFutureDate } from "@/lib/date-utils";
import { ChevronLeft, ChevronRight, Droplets, Flame, Star, AlertTriangle, Circle } from "lucide-react";
import { DayDetailPanel } from "@/components/day-detail-panel";

export default function Home() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: logs, isLoading: isLogsLoading } = useListDietLogs(
    { year: currentYear, month: currentMonth },
    { query: { queryKey: getListDietLogsQueryKey({ year: currentYear, month: currentMonth }) } }
  );

  const { data: summary, isLoading: isSummaryLoading } = useGetMonthSummary(
    { year: currentYear, month: currentMonth },
    { query: { queryKey: getGetMonthSummaryQueryKey({ year: currentYear, month: currentMonth }) } }
  );

  const { mutate: upsertLog } = useUpsertDietLog();

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDate(null);
  };

  const markCheatDay = (date: string) => {
    upsertLog(
      { 
        data: { 
          date, 
          breakfastType: "junk", 
          lunchType: "junk", 
          dinnerType: "junk", 
          snacksType: "junk" 
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDietLogsQueryKey({ year: currentYear, month: currentMonth }) });
          queryClient.invalidateQueries({ queryKey: getGetMonthSummaryQueryKey({ year: currentYear, month: currentMonth }) });
          queryClient.invalidateQueries({ queryKey: getGetDietLogQueryKey(date) });
        }
      }
    );
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getStatusColor = (status?: string) => {
    switch(status) {
      case "clean": return "bg-primary text-primary-foreground";
      case "cheat": return "bg-destructive text-destructive-foreground";
      case "moderate": return "bg-accent text-accent-foreground border border-primary/20";
      default: return "bg-card text-muted-foreground border border-border";
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row">
      <main className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-primary mb-2 tracking-tight">DietTrack</h1>
            <p className="text-muted-foreground text-lg">Your daily ritual for mindful eating.</p>
          </div>
          
          {summary && !isSummaryLoading && (
            <div className="flex items-center gap-6 bg-card px-6 py-4 rounded-2xl border shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-serif text-primary">{summary.currentStreak}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Streak</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-serif text-primary">{summary.cleanDays}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Clean</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-serif text-destructive">{summary.cheatDays}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Cheat</div>
              </div>
            </div>
          )}
        </header>

        <div className="bg-card border rounded-3xl p-6 lg:p-8 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif text-primary">{monthNames[currentMonth - 1]} {currentYear}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="rounded-full">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4 auto-rows-fr">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatDate(currentYear, currentMonth, dayNum);
              const log = logs?.find(l => l.date === dateStr);
              const isFuture = isFutureDate(dateStr);
              const isSelected = selectedDate === dateStr;
              
              return (
                <button
                  key={dateStr}
                  onClick={() => !isFuture && setSelectedDate(dateStr)}
                  disabled={isFuture}
                  className={`
                    relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300
                    ${isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer shadow-sm hover:shadow-md'}
                    ${getStatusColor(log?.dayStatus)}
                    ${isSelected ? 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105 z-10' : ''}
                  `}
                >
                  <span className="text-xl font-serif font-medium">{dayNum}</span>
                  {log?.dayStatus === "clean" && <Star className="w-4 h-4 mt-1 opacity-80" />}
                  {log?.dayStatus === "cheat" && <Flame className="w-4 h-4 mt-1 opacity-80" />}
                  {log?.dayStatus === "moderate" && <Circle className="w-3 h-3 mt-1 opacity-60" />}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <aside className={`
        w-full md:w-[400px] lg:w-[480px] bg-card border-l flex flex-col transition-all duration-500 ease-in-out
        ${selectedDate ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        fixed md:relative top-0 right-0 bottom-0 z-50 shadow-2xl md:shadow-none
      `}>
        {selectedDate ? (
          <DayDetailPanel 
            date={selectedDate} 
            onClose={() => setSelectedDate(null)} 
            onMarkCheatDay={() => markCheatDay(selectedDate)}
            currentYear={currentYear}
            currentMonth={currentMonth}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center">
              <Star className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-serif text-primary mb-2">Select a Day</h3>
            <p>Click on any day in the calendar to log your meals and track your progress.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
