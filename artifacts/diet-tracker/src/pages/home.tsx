import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useListDietLogs,
  useGetMonthSummary,
  useUpsertDietLog,
  useGetProfile,
  getListDietLogsQueryKey,
  getGetMonthSummaryQueryKey,
  getGetDietLogQueryKey,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import type { DietLog } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { getDaysInMonth, getFirstDayOfMonth, formatDate, isFutureDate } from "@/lib/date-utils";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Star,
  AlertTriangle,
  Circle,
  Settings,
  TrendingUp,
  Droplets,
  LogOut,
} from "lucide-react";
import { DayDetailPanel } from "@/components/day-detail-panel";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getStatusColor(status?: string) {
  switch (status) {
    case "clean":    return "bg-primary text-[hsl(225_25%_7%)] border-transparent shadow-[0_0_12px_rgba(39,210,120,0.25)]";
    case "cheat":    return "bg-destructive text-white border-transparent";
    case "moderate": return "bg-[hsl(38_95%_55%)] text-[hsl(225_25%_7%)] border-transparent";
    default:         return "bg-card text-muted-foreground border-border hover:border-primary/40";
  }
}

function WeekSummary({
  logs,
  dailyGoal,
}: {
  logs: DietLog[];
  dailyGoal: number;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const log = logs?.find((l) => l.date === dateStr);
    return { dateStr, dayLabel: DAY_NAMES[d.getDay()], dayNum: d.getDate(), log };
  });

  const logged = days.filter((d) => d.log && d.log.dayStatus !== "empty");
  const cleanCount = logged.filter((d) => d.log?.dayStatus === "clean").length;
  const cheatCount = logged.filter((d) => d.log?.dayStatus === "cheat").length;
  const stars = cleanCount >= 6 ? 5 : cleanCount >= 4 ? 4 : cleanCount >= 3 ? 3 : cleanCount >= 2 ? 2 : cleanCount >= 1 ? 1 : 0;
  const totalCalories = days.reduce((s, d) => s + (d.log?.calories ?? 0), 0);
  const avgCalories = logged.length > 0 ? Math.round(totalCalories / logged.length) : null;

  return (
    <div className="bg-card border border-border rounded-3xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Past 7 Days</h3>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < stars ? "text-[hsl(38_95%_55%)] fill-[hsl(38_95%_55%)]" : "text-muted"}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 font-semibold">{stars}/5</span>
        </div>
      </div>

      {/* Day tiles */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map(({ dateStr, dayLabel, dayNum, log }) => {
          const status = log?.dayStatus;
          const cal = log?.calories;
          const pct = cal && dailyGoal ? Math.min((cal / dailyGoal) * 100, 100) : 0;
          const barColor =
            status === "clean"    ? "bg-primary"
            : status === "cheat"  ? "bg-destructive"
            : status === "moderate" ? "bg-[hsl(38_95%_55%)]"
            : "bg-muted";

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">{dayLabel}</span>
              <div
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center border transition-all
                  ${getStatusColor(status ?? "empty")}`}
              >
                <span className="text-sm font-serif font-bold leading-none">{dayNum}</span>
                {status === "clean"    && <Star className="w-2.5 h-2.5 mt-0.5 opacity-80" />}
                {status === "cheat"    && <Flame className="w-2.5 h-2.5 mt-0.5 opacity-80" />}
                {status === "moderate" && <Circle className="w-2 h-2 mt-0.5 opacity-70" />}
              </div>
              {/* Mini calorie bar */}
              {cal ? (
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              ) : (
                <div className="w-full h-1" />
              )}
              {cal ? (
                <span className="text-[9px] text-muted-foreground font-semibold">{cal >= 1000 ? `${(cal/1000).toFixed(1)}k` : cal}</span>
              ) : (
                <span className="text-[9px] text-muted/50">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground font-semibold">{cleanCount} clean</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground font-semibold">{cheatCount} cheat</span>
        </div>
        {avgCalories !== null && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Flame className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-semibold">Avg {avgCalories.toLocaleString()} kcal/day</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: profile, error: profileError } = useGetProfile({
    query: { queryKey: getGetProfileQueryKey(), retry: false },
  });

  useEffect(() => {
    if (profileError) setLocation("/onboarding");
  }, [profileError, setLocation]);

  const { data: logs } = useListDietLogs(
    { year: currentYear, month: currentMonth },
    { query: { queryKey: getListDietLogsQueryKey({ year: currentYear, month: currentMonth }) } }
  );

  const { data: summary } = useGetMonthSummary(
    { year: currentYear, month: currentMonth },
    { query: { queryKey: getGetMonthSummaryQueryKey({ year: currentYear, month: currentMonth }) } }
  );

  const { mutate: upsertLog } = useUpsertDietLog();

  const handlePrevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const markCheatDay = (date: string) => {
    upsertLog(
      { data: { date, breakfastType: "junk", lunchType: "junk", dinnerType: "junk", snacksType: "junk" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDietLogsQueryKey({ year: currentYear, month: currentMonth }) });
          queryClient.invalidateQueries({ queryKey: getGetMonthSummaryQueryKey({ year: currentYear, month: currentMonth }) });
          queryClient.invalidateQueries({ queryKey: getGetDietLogQueryKey(date) });
        },
      }
    );
  };

  if (!profile && !profileError) return null;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row">
      <main className="flex-1 flex flex-col p-5 lg:p-10 overflow-y-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-serif text-primary tracking-tight">DietTrack</h1>
              <Button variant="outline" size="sm" onClick={() => setLocation("/onboarding")} className="h-7 text-xs">
                <Settings className="w-3 h-3 mr-1.5" /> Profile
              </Button>
              <Button variant="ghost" size="sm" onClick={logout} className="h-7 text-xs text-muted-foreground hover:text-destructive">
                <LogOut className="w-3 h-3 mr-1.5" /> Sign out
              </Button>
            </div>
            {user && (
              <p className="text-muted-foreground text-xs mb-0.5">
                Signed in as <span className="text-foreground font-medium">{user.firstName || user.email || "you"}</span>
              </p>
            )}
            {profile && (
              <p className="text-muted-foreground text-sm">
                Daily goal: <span className="text-primary font-semibold">{profile.dailyCalorieGoal.toLocaleString()} kcal</span>
                {" · "}{profile.weightKg}kg · {profile.gender}
                {" · "}<span className="text-[hsl(262_60%_60%)]">{profile.dailyProteinGoal}g protein</span>
              </p>
            )}
          </div>

          {summary && (
            <div className="flex items-center gap-5 bg-card px-5 py-3 rounded-2xl border border-border shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-serif text-primary">{summary.currentStreak}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Streak</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-serif text-primary">{summary.cleanDays}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Clean</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-serif text-destructive">{summary.cheatDays}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Cheat</div>
              </div>
              {summary.avgCalories !== null && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="text-xl font-serif text-muted-foreground">{Math.round(summary.avgCalories).toLocaleString()}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Avg kcal</div>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        {/* Past 7 days summary */}
        {logs && profile && (
          <WeekSummary logs={logs} dailyGoal={profile.dailyCalorieGoal} />
        )}

        {/* Calendar */}
        <div className="bg-card border border-border rounded-3xl p-5 lg:p-7 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-primary">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="rounded-full bg-transparent h-9 w-9">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="rounded-full bg-transparent h-9 w-9">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-3">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 auto-rows-fr">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatDate(currentYear, currentMonth, dayNum);
              const log = logs?.find((l) => l.date === dateStr);
              const isFuture = isFutureDate(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === now.toISOString().split("T")[0];

              return (
                <button
                  key={dateStr}
                  onClick={() => !isFuture && setSelectedDate(dateStr)}
                  disabled={isFuture}
                  className={`
                    relative aspect-square border rounded-2xl flex flex-col items-center justify-center transition-all duration-200
                    ${isFuture ? "opacity-25 cursor-not-allowed" : "hover:-translate-y-0.5 cursor-pointer hover:shadow-md"}
                    ${getStatusColor(log?.dayStatus)}
                    ${isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-background scale-105 z-10" : ""}
                    ${isToday && !log?.dayStatus ? "border-primary/50 border-2" : ""}
                  `}
                >
                  <span className="text-lg font-serif font-semibold leading-none">{dayNum}</span>
                  {log?.dayStatus === "clean"    && <Star className="w-3 h-3 mt-0.5 opacity-80" />}
                  {log?.dayStatus === "cheat"    && <Flame className="w-3 h-3 mt-0.5 opacity-80" />}
                  {log?.dayStatus === "moderate" && <Circle className="w-2.5 h-2.5 mt-0.5 opacity-70" />}
                  {/* Calorie indicator dot */}
                  {log?.calories && profile && log.calories > profile.dailyCalorieGoal && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary" /><span className="text-xs text-muted-foreground">Clean</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[hsl(38_95%_55%)]" /><span className="text-xs text-muted-foreground">Moderate</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-destructive" /><span className="text-xs text-muted-foreground">Cheat</span></div>
            <div className="flex items-center gap-1.5 ml-auto"><span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" /><span className="text-xs text-muted-foreground">Over cal goal</span></div>
          </div>
        </div>
      </main>

      {/* Day detail sidebar */}
      <aside
        className={`
          w-full md:w-[420px] lg:w-[460px] bg-card border-l border-border flex flex-col transition-transform duration-400 ease-in-out
          ${selectedDate ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          fixed md:relative top-0 right-0 bottom-0 z-50 shadow-2xl md:shadow-none
        `}
      >
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
            <div className="w-20 h-20 mb-5 rounded-full bg-muted border border-border flex items-center justify-center">
              <Star className="w-9 h-9 text-primary/40" />
            </div>
            <h3 className="text-xl font-serif text-primary mb-2">Select a Day</h3>
            <p className="text-sm">Click any day on the calendar to log your meals and track calories.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
