/**
 * FitnessTracker Dashboard
 * A modern dark-mode fitness tracking app with:
 * - MET-based calorie calculation
 * - LocalStorage persistence
 * - Recharts bar chart for last 5 activities
 * - Daily progress bar (goal: 500 cal/day)
 * - Smooth animations
 */

import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── MET values per exercise type ───────────────────────────────────────────
const MET_VALUES = {
  Running: 8,
  Walking: 3.5,
  Cycling: 6,
  Gym: 5,
};

// ─── Exercise icons ──────────────────────────────────────────────────────────
const EXERCISE_ICONS = {
  Running: "🏃",
  Walking: "🚶",
  Cycling: "🚴",
  Gym: "🏋️",
};

// ─── Accent colours per exercise ────────────────────────────────────────────
const EXERCISE_COLORS = {
  Running: "#f97316",
  Walking: "#22d3ee",
  Cycling: "#a78bfa",
  Gym: "#34d399",
};

// ─── Daily calorie goal ──────────────────────────────────────────────────────
const DAILY_GOAL = 500;

// ─── Storage helpers ─────────────────────────────────────────────────────────
const loadActivities = () => {
  try {
    const stored = localStorage.getItem("ft_activities");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveActivities = (activities) => {
  try {
    localStorage.setItem("ft_activities", JSON.stringify(activities));
  } catch {
    /* quota exceeded – fail silently */
  }
};

// ─── Utility: calories burned ────────────────────────────────────────────────
const calcCalories = (exercise, weight, minutes) => {
  const met = MET_VALUES[exercise] ?? 5;
  return Math.round(met * weight * (minutes / 60));
};

// ─── Utility: feedback message ───────────────────────────────────────────────
const getFeedback = (calories) => {
  if (calories > 300) return { msg: "Good job! 🔥", color: "#34d399" };
  if (calories >= 150) return { msg: "Keep going! 💪", color: "#fbbf24" };
  return { msg: "Try to be more active! 🌱", color: "#f87171" };
};

// ─── Animated number counter ─────────────────────────────────────────────────
function CountUp({ target, duration = 800 }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);
  const from = useRef(0);

  useEffect(() => {
    from.current = val;
    start.current = null;
    cancelAnimationFrame(raf.current);

    const step = (ts) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setVal(Math.round(from.current + (target - from.current) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span>{val}</span>;
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ current, goal }) {
  const pct = Math.min((current / goal) * 100, 100);
  const color =
    pct >= 100 ? "#34d399" : pct >= 60 ? "#fbbf24" : "#f97316";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono">
        <span style={{ color }} className="font-semibold tracking-wider">
          {Math.round(pct)}% OF DAILY GOAL
        </span>
        <span className="text-zinc-500">
          {current} / {goal} kcal
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 10px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, icon, accent, animate }) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: `0 0 40px ${accent}18`,
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20"
        style={{ background: accent }}
      />
      <p className="text-xs font-mono tracking-widest text-zinc-500 mb-3">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-white">
          {animate ? <CountUp target={value} /> : value}
        </span>
        <span className="text-zinc-400 text-sm mb-0.5">{unit}</span>
        <span className="ml-auto text-2xl">{icon}</span>
      </div>
    </div>
  );
}

// ─── Custom Tooltip for chart ─────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold">{d.calories} kcal</p>
      <p className="text-zinc-500 text-xs">
        {d.exercise} · {d.duration}min · {d.weight}kg
      </p>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FitnessTracker() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activities, setActivities] = useState(loadActivities);
  const [form, setForm] = useState({
    weight: "",
    exercise: "Running",
    duration: "",
  });
  const [result, setResult] = useState(null); // { calories, feedback }
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [shake, setShake] = useState(false);

  // ── Persist activities ─────────────────────────────────────────────────────
  useEffect(() => {
    saveActivities(activities);
  }, [activities]);

  // ── Computed values ────────────────────────────────────────────────────────
  const totalCalories = activities.reduce((sum, a) => sum + a.calories, 0);
  const todayStr = new Date().toDateString();
  const todayCalories = activities
    .filter((a) => new Date(a.timestamp).toDateString() === todayStr)
    .reduce((sum, a) => sum + a.calories, 0);
  const lastActivity = activities[activities.length - 1] ?? null;
  const chartData = activities.slice(-5).map((a, i) => ({
    name: `#${activities.length - (activities.slice(-5).length - 1 - i)}`,
    calories: a.calories,
    exercise: a.exercise,
    duration: a.duration,
    weight: a.weight,
  }));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.weight || isNaN(form.weight) || +form.weight <= 0)
      e.weight = "Enter a valid weight (kg)";
    if (!form.duration || isNaN(form.duration) || +form.duration <= 0)
      e.duration = "Enter a valid duration (min)";
    return e;
  };

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setErrors({});

    const calories = calcCalories(form.exercise, +form.weight, +form.duration);
    const feedback = getFeedback(calories);

    const newActivity = {
      id: Date.now(),
      exercise: form.exercise,
      weight: +form.weight,
      duration: +form.duration,
      calories,
      timestamp: Date.now(),
    };

    setActivities((prev) => [...prev, newActivity]);
    setResult({ calories, feedback });
    setSubmitted(true);
    setForm((f) => ({ ...f, duration: "", weight: "" }));
  };

  // ── Reset result panel ─────────────────────────────────────────────────────
  const handleReset = () => {
    setResult(null);
    setSubmitted(false);
  };

  // ── Clear all history ──────────────────────────────────────────────────────
  const handleClearAll = () => {
    if (window.confirm("Clear all activity history?")) {
      setActivities([]);
      setResult(null);
      setSubmitted(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "#0c0c0f",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* Font import via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        @keyframes pop {
          0%   { transform: scale(0.85); opacity: 0; }
          70%  { transform: scale(1.04); }
          100% { transform: scale(1);   opacity: 1; }
        }
        .fade-up   { animation: fadeUp 0.5s ease both; }
        .shake     { animation: shake 0.45s ease; }
        .pop       { animation: pop 0.4s cubic-bezier(.34,1.56,.64,1) both; }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); }
        input, select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          width: 100% !important;
          font-size: 15px !important;
          outline: none !important;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        input:focus, select:focus {
          border-color: rgba(249,115,22,0.6) !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
        }
        input::placeholder { color: #52525b; }
        select option { background: #18181b; }
        input[type=range] {
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          accent-color: #f97316;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(12,12,15,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)" }}
          >
            🔥
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">FitTrack</h1>
            <p className="text-xs text-zinc-500 font-mono">DASHBOARD</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 hidden sm:block font-mono">
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </span>
          {activities.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors font-mono tracking-wider"
            >
              CLEAR ALL
            </button>
          )}
        </div>
      </header>

      {/* ── Main Layout ────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Stat Cards Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-up">
          <StatCard
            label="TOTAL CALORIES"
            value={totalCalories}
            unit="kcal"
            icon="🔥"
            accent="#f97316"
            animate
          />
          <StatCard
            label="TODAY"
            value={todayCalories}
            unit="kcal"
            icon="📅"
            accent="#22d3ee"
            animate
          />
          <StatCard
            label="ACTIVITIES"
            value={activities.length}
            unit="logged"
            icon="📋"
            accent="#a78bfa"
            animate
          />
          <StatCard
            label="LAST EXERCISE"
            value={lastActivity ? EXERCISE_ICONS[lastActivity.exercise] + " " + lastActivity.calories : "—"}
            unit={lastActivity ? "kcal" : ""}
            icon="⚡"
            accent="#34d399"
            animate={false}
          />
        </div>

        {/* ── Daily Progress ───────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 fade-up"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            animationDelay: "0.05s",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily Progress</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Goal: {DAILY_GOAL} kcal/day</p>
            </div>
            {todayCalories >= DAILY_GOAL && (
              <span
                className="text-xs font-mono px-3 py-1 rounded-full pop"
                style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}
              >
                ✓ GOAL MET
              </span>
            )}
          </div>
          <ProgressBar current={todayCalories} goal={DAILY_GOAL} />
        </div>

        {/* ── Two-column: Form + Chart ─────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* ── Log Activity Form ──────────────────────────────────────────── */}
          <div
            className={`rounded-2xl p-6 fade-up ${shake ? "shake" : ""}`}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              animationDelay: "0.1s",
            }}
          >
            <h2 className="text-sm font-semibold mb-5 tracking-wide">
              Log Activity
            </h2>

            {!submitted ? (
              <div className="space-y-4">
                {/* Weight */}
                <div>
                  <label className="block text-xs text-zinc-500 font-mono mb-2 tracking-widest">
                    WEIGHT (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    value={form.weight}
                    onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                    min="1"
                    max="300"
                  />
                  {errors.weight && (
                    <p className="text-red-400 text-xs mt-1">{errors.weight}</p>
                  )}
                </div>

                {/* Exercise type */}
                <div>
                  <label className="block text-xs text-zinc-500 font-mono mb-2 tracking-widest">
                    EXERCISE TYPE
                  </label>
                  <select
                    value={form.exercise}
                    onChange={(e) => setForm((f) => ({ ...f, exercise: e.target.value }))}
                  >
                    {Object.keys(MET_VALUES).map((ex) => (
                      <option key={ex} value={ex}>
                        {EXERCISE_ICONS[ex]} {ex} (MET {MET_VALUES[ex]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs text-zinc-500 font-mono mb-2 tracking-widest">
                    DURATION (min)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    min="1"
                    max="480"
                  />
                  {errors.duration && (
                    <p className="text-red-400 text-xs mt-1">{errors.duration}</p>
                  )}
                </div>

                {/* Live preview */}
                {form.weight && form.duration && +form.weight > 0 && +form.duration > 0 && (
                  <div
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}
                  >
                    <span className="text-zinc-400 text-xs font-mono">ESTIMATED: </span>
                    <span className="text-orange-400 font-bold">
                      ~{calcCalories(form.exercise, +form.weight, +form.duration)} kcal
                    </span>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.target.style.boxShadow = "0 6px 28px rgba(249,115,22,0.5)")}
                  onMouseLeave={(e) => (e.target.style.boxShadow = "0 4px 20px rgba(249,115,22,0.3)")}
                >
                  Calculate & Log 🔥
                </button>
              </div>
            ) : (
              /* ── Result Panel ───────────────────────────────────────────── */
              <div className="space-y-5 pop">
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">
                    {EXERCISE_ICONS[activities[activities.length - 1]?.exercise]}
                  </div>
                  <p className="text-zinc-400 text-xs font-mono mb-1">CALORIES BURNED</p>
                  <p
                    className="text-5xl font-bold"
                    style={{ color: EXERCISE_COLORS[activities[activities.length - 1]?.exercise] }}
                  >
                    {result.calories}
                    <span className="text-lg text-zinc-500 font-normal ml-1">kcal</span>
                  </p>
                </div>

                <div
                  className="rounded-xl px-5 py-4 text-center"
                  style={{
                    background: `${result.feedback.color}12`,
                    border: `1px solid ${result.feedback.color}30`,
                  }}
                >
                  <p className="font-semibold" style={{ color: result.feedback.color }}>
                    {result.feedback.msg}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  {[
                    ["Exercise", activities[activities.length - 1]?.exercise],
                    ["Duration", `${activities[activities.length - 1]?.duration} min`],
                    ["Weight", `${activities[activities.length - 1]?.weight} kg`],
                    ["MET", MET_VALUES[activities[activities.length - 1]?.exercise]],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="text-xs text-zinc-500 font-mono">{k.toUpperCase()}</p>
                      <p className="font-semibold text-white mt-0.5 text-sm">{v}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  + Log Another Activity
                </button>
              </div>
            )}
          </div>

          {/* ── Activity Chart ─────────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-6 fade-up"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              animationDelay: "0.15s",
            }}
          >
            <h2 className="text-sm font-semibold mb-1 tracking-wide">Last 5 Activities</h2>
            <p className="text-xs text-zinc-500 font-mono mb-6">CALORIES BURNED PER SESSION</p>

            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm">No activities yet</p>
                <p className="text-xs mt-1">Log your first workout!</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={36}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#71717a", fontSize: 11, fontFamily: "DM Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11, fontFamily: "DM Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={EXERCISE_COLORS[entry.exercise] || "#f97316"}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Legend */}
            {chartData.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {Object.entries(EXERCISE_COLORS).map(([ex, color]) => (
                  <div key={ex} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    {ex}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent History Table ─────────────────────────────────────────── */}
        {activities.length > 0 && (
          <div
            className="rounded-2xl p-6 fade-up"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              animationDelay: "0.2s",
            }}
          >
            <h2 className="text-sm font-semibold mb-5 tracking-wide">Activity History</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[...activities].reverse().map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 rounded-xl px-4 py-3 card-hover"
                  style={{
                    background: i === 0 ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${i === 0 ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{
                      background: `${EXERCISE_COLORS[a.exercise]}18`,
                      border: `1px solid ${EXERCISE_COLORS[a.exercise]}30`,
                    }}
                  >
                    {EXERCISE_ICONS[a.exercise]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{a.exercise}</span>
                      {i === 0 && (
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
                        >
                          LATEST
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                      {a.duration}min · {a.weight}kg ·{" "}
                      {new Date(a.timestamp).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-base font-bold"
                      style={{ color: EXERCISE_COLORS[a.exercise] }}
                    >
                      {a.calories}
                    </p>
                    <p className="text-xs text-zinc-500 font-mono">kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="text-center text-zinc-700 text-xs font-mono pb-4 fade-up" style={{ animationDelay: "0.3s" }}>
          FITTRACK · MET-BASED CALORIE CALCULATOR · DATA STORED LOCALLY
        </footer>
      </main>
    </div>
  );
}
