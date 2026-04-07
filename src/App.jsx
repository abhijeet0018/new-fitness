import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

function App() {
  const [form, setForm] = useState({
    weight: "",
    duration: "",
    exercise: "Running",
  });

  const [activities, setActivities] = useState([]);
  const [result, setResult] = useState(null);

  // Calories calculation (simple logic)
  const calculateCalories = (weight, duration, exercise) => {
    const MET = {
      Running: 9.8,
      Walking: 3.8,
      Cycling: 7.5,
      Yoga: 2.5,
    };

    return ((MET[exercise] * weight * 3.5) / 200) * duration;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.weight || !form.duration) return;

    const calories = calculateCalories(
      +form.weight,
      +form.duration,
      form.exercise
    );

    const newActivity = {
      ...form,
      weight: +form.weight,
      duration: +form.duration,
      calories: Math.round(calories),
    };

    setActivities([...activities, newActivity]);
    setResult(newActivity);

    // Reset form
    setForm({
      weight: "",
      duration: "",
      exercise: "Running",
    });
  };

  // Chart data
  const chartData = useMemo(() => {
    return activities.map((item, index) => ({
      name: item.exercise + " " + (index + 1),
      calories: item.calories,
    }));
  }, [activities]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🏋️ Fitness Tracker Dashboard</h1>

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="number"
          placeholder="Weight (kg)"
          value={form.weight}
          onChange={(e) =>
            setForm({ ...form, weight: e.target.value })
          }
          style={{ marginRight: "10px" }}
        />

        <input
          type="number"
          placeholder="Duration (minutes)"
          value={form.duration}
          onChange={(e) =>
            setForm({ ...form, duration: e.target.value })
          }
          style={{ marginRight: "10px" }}
        />

        <select
          value={form.exercise}
          onChange={(e) =>
            setForm({ ...form, exercise: e.target.value })
          }
          style={{ marginRight: "10px" }}
        >
          <option>Running</option>
          <option>Walking</option>
          <option>Cycling</option>
          <option>Yoga</option>
        </select>

        <button type="submit">Calculate</button>
      </form>

      {/* RESULT */}
      {result && (
        <div style={{ marginBottom: "20px" }}>
          <h3>🔥 Calories Burned: {result.calories} kcal</h3>
        </div>
      )}

      {/* CHART */}
      {activities.length > 0 && (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calories">
                {chartData.map((entry, index) => (
                  <Cell key={index} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;
