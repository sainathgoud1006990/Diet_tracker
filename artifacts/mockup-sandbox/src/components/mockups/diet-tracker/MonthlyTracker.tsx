import { useState } from "react";

type MealType = "healthy" | "junk" | "moderate" | null;

interface DayLog {
  meals: {
    breakfast: MealType;
    lunch: MealType;
    dinner: MealType;
    snacks: MealType;
  };
  water: number;
  calories: number | null;
  note: string;
}

const defaultDay = (): DayLog => ({
  meals: { breakfast: null, lunch: null, dinner: null, snacks: null },
  water: 0,
  calories: null,
  note: "",
});

const MONTH_DAYS = 31;

const mealLabel: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

function getDayStatus(log: DayLog): "clean" | "cheat" | "moderate" | "empty" {
  const values = Object.values(log.meals).filter(Boolean) as MealType[];
  if (values.length === 0) return "empty";
  if (values.includes("junk")) return "cheat";
  if (values.includes("moderate")) return "moderate";
  return "clean";
}

const dayStatusConfig = {
  clean: {
    bg: "bg-emerald-500",
    text: "text-white",
    label: "Clean",
    dot: "bg-emerald-400",
  },
  cheat: {
    bg: "bg-rose-500",
    text: "text-white",
    label: "Cheat",
    dot: "bg-rose-400",
  },
  moderate: {
    bg: "bg-amber-400",
    text: "text-white",
    label: "Moderate",
    dot: "bg-amber-300",
  },
  empty: {
    bg: "bg-slate-800",
    text: "text-slate-400",
    label: "Not logged",
    dot: "bg-slate-600",
  },
};

const mealTypeConfig = {
  healthy: { label: "Healthy", color: "bg-emerald-500 text-white" },
  moderate: { label: "Moderate", color: "bg-amber-400 text-white" },
  junk: { label: "Junk", color: "bg-rose-500 text-white" },
};

export function MonthlyTracker() {
  const today = new Date();
  const currentDay = today.getDate();
  const [logs, setLogs] = useState<Record<number, DayLog>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(currentDay);
  const [activeMonth] = useState("June 2025");

  const getDayLog = (day: number): DayLog => logs[day] ?? defaultDay();

  const updateMeal = (day: number, meal: keyof DayLog["meals"], type: MealType) => {
    const log = getDayLog(day);
    setLogs((prev) => ({
      ...prev,
      [day]: { ...log, meals: { ...log.meals, [meal]: type } },
    }));
  };

  const updateWater = (day: number, cups: number) => {
    const log = getDayLog(day);
    setLogs((prev) => ({ ...prev, [day]: { ...log, water: cups } }));
  };

  const updateNote = (day: number, note: string) => {
    const log = getDayLog(day);
    setLogs((prev) => ({ ...prev, [day]: { ...log, note } }));
  };

  const stats = Array.from({ length: MONTH_DAYS }, (_, i) => i + 1).reduce(
    (acc, d) => {
      const s = getDayStatus(getDayLog(d));
      if (s === "clean") acc.clean++;
      else if (s === "cheat") acc.cheat++;
      else if (s === "moderate") acc.moderate++;
      return acc;
    },
    { clean: 0, cheat: 0, moderate: 0 }
  );

  const logged = stats.clean + stats.cheat + stats.moderate;
  const streak = (() => {
    let s = 0;
    for (let d = currentDay; d >= 1; d--) {
      if (getDayStatus(getDayLog(d)) === "clean") s++;
      else break;
    }
    return s;
  })();

  const selectedLog = selectedDay ? getDayLog(selectedDay) : null;
  const selectedStatus = selectedDay ? getDayStatus(getDayLog(selectedDay)) : "empty";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel — Calendar */}
      <div className="flex flex-col w-[480px] min-h-screen border-r border-slate-800 bg-slate-950">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-sm font-bold">D</div>
            <span className="text-slate-400 text-sm tracking-widest uppercase font-medium">DietTrack</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-4">{activeMonth}</h1>
          <p className="text-slate-500 text-sm mt-1">31-day challenge tracker</p>
        </div>

        {/* Stats strip */}
        <div className="mx-6 mb-5 grid grid-cols-4 gap-2">
          {[
            { label: "Logged", value: logged, color: "text-white" },
            { label: "Clean", value: stats.clean, color: "text-emerald-400" },
            { label: "Cheat", value: stats.cheat, color: "text-rose-400" },
            { label: "Streak", value: `${streak}d`, color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 rounded-xl px-3 py-3 flex flex-col items-center">
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
              <span className="text-slate-500 text-xs mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Day-of-week headers */}
        <div className="px-6 mb-2 grid grid-cols-7 gap-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-600 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid — June 2025 starts on Sunday */}
        <div className="px-6 grid grid-cols-7 gap-1.5 flex-1">
          {/* June 2025 starts on Sunday (offset = 0) */}
          {Array.from({ length: MONTH_DAYS }, (_, i) => i + 1).map((day) => {
            const status = getDayStatus(getDayLog(day));
            const cfg = dayStatusConfig[status];
            const isSelected = selectedDay === day;
            const isToday = day === currentDay;
            const isFuture = day > currentDay;

            return (
              <button
                key={day}
                onClick={() => !isFuture && setSelectedDay(day)}
                className={`
                  relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all
                  ${isFuture ? "bg-slate-900 text-slate-700 cursor-default" : `${cfg.bg} ${cfg.text} hover:scale-105 cursor-pointer`}
                  ${isSelected && !isFuture ? "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-105" : ""}
                `}
              >
                <span className={`text-sm font-bold ${isFuture ? "text-slate-700" : ""}`}>{day}</span>
                {isToday && !isFuture && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white opacity-80" />
                )}
                {!isFuture && status !== "empty" && (
                  <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-6 py-4 flex items-center gap-4 border-t border-slate-800 mt-4">
          {Object.entries(dayStatusConfig)
            .filter(([k]) => k !== "empty")
            .map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${v.bg}`} />
                <span className="text-xs text-slate-400">{v.label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Right Panel — Day Detail */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-900">
        {selectedDay && selectedLog ? (
          <>
            {/* Day header */}
            <div className="px-8 pt-8 pb-5 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Day {selectedDay} · June 2025</p>
                  <h2 className="text-3xl font-bold text-white">
                    {selectedDay === currentDay ? "Today" : `Day ${selectedDay}`}
                  </h2>
                </div>
                <div className={`px-4 py-2 rounded-2xl ${dayStatusConfig[selectedStatus].bg} flex items-center gap-2`}>
                  <span className="text-white font-semibold text-sm">
                    {selectedStatus === "cheat" ? "🚫 Cheat Day" :
                     selectedStatus === "clean" ? "✅ Clean Day" :
                     selectedStatus === "moderate" ? "⚠️ Moderate" : "— Not Logged"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Meals */}
              <div>
                <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">Meals</h3>
                <div className="space-y-2">
                  {(Object.keys(mealLabel) as (keyof DayLog["meals"])[]).map((meal) => {
                    const current = selectedLog.meals[meal];
                    return (
                      <div key={meal} className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{mealLabel[meal]}</span>
                        <div className="flex gap-2">
                          {(["healthy", "moderate", "junk"] as MealType[]).filter(Boolean).map((type) => (
                            <button
                              key={type!}
                              onClick={() => updateMeal(selectedDay, meal, current === type ? null : type)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                current === type
                                  ? mealTypeConfig[type!].color
                                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                              }`}
                            >
                              {mealTypeConfig[type!].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Water intake */}
              <div>
                <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">Water Intake</h3>
                <div className="bg-slate-800 rounded-2xl px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-sm font-medium">{selectedLog.water} / 8 cups</span>
                    <span className="text-slate-400 text-xs">{Math.round((selectedLog.water / 8) * 100)}%</span>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {Array.from({ length: 8 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          updateWater(selectedDay, selectedLog.water === i + 1 ? i : i + 1)
                        }
                        className={`flex-1 h-8 rounded-lg transition-all ${
                          i < selectedLog.water
                            ? "bg-sky-500"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateWater(selectedDay, Math.max(0, selectedLog.water - 1))}
                      className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-all"
                    >
                      − Remove
                    </button>
                    <button
                      onClick={() => updateWater(selectedDay, Math.min(8, selectedLog.water + 1))}
                      className="flex-1 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 transition-all"
                    >
                      + Add Cup
                    </button>
                  </div>
                </div>
              </div>

              {/* Calories */}
              <div>
                <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">Calories</h3>
                <div className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-slate-400 text-sm">Total kcal</span>
                  <input
                    type="number"
                    placeholder="e.g. 1800"
                    value={selectedLog.calories ?? ""}
                    onChange={(e) => {
                      const log = getDayLog(selectedDay);
                      setLogs((prev) => ({
                        ...prev,
                        [selectedDay]: { ...log, calories: e.target.value ? Number(e.target.value) : null },
                      }));
                    }}
                    className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder-slate-600"
                  />
                  {selectedLog.calories && (
                    <span
                      className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        selectedLog.calories > 2200
                          ? "bg-rose-900 text-rose-300"
                          : selectedLog.calories < 1200
                          ? "bg-amber-900 text-amber-300"
                          : "bg-emerald-900 text-emerald-300"
                      }`}
                    >
                      {selectedLog.calories > 2200
                        ? "High"
                        : selectedLog.calories < 1200
                        ? "Low"
                        : "On track"}
                    </span>
                  )}
                </div>
              </div>

              {/* Daily note */}
              <div>
                <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">Daily Note</h3>
                <textarea
                  placeholder="How did you feel? Any cravings? Note anything..."
                  value={selectedLog.note}
                  onChange={(e) => updateNote(selectedDay, e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none resize-none focus:ring-1 focus:ring-slate-600"
                />
              </div>

              {/* Quick mark cheat */}
              {selectedStatus !== "cheat" && (
                <button
                  onClick={() => {
                    const log = getDayLog(selectedDay);
                    setLogs((prev) => ({
                      ...prev,
                      [selectedDay]: {
                        ...log,
                        meals: { breakfast: "junk", lunch: "junk", dinner: "junk", snacks: "junk" },
                      },
                    }));
                  }}
                  className="w-full py-3 rounded-2xl border border-rose-800 text-rose-400 text-sm font-semibold hover:bg-rose-950 transition-all"
                >
                  Mark Entire Day as Cheat Day
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-600">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-lg font-medium">Select a day to log</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
