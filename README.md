# 🔥 FitTrack Dashboard

A modern, dark-mode fitness tracking dashboard built with **React + Vite + Tailwind CSS + Recharts**.

## Features
- 🧮 MET-formula calorie calculation (Running, Walking, Cycling, Gym)
- 📊 Bar chart of last 5 activities (Recharts)
- 📅 Daily progress bar (goal: 500 kcal/day)
- 💾 LocalStorage persistence — data survives page reloads
- ✨ Smooth animations (fadeUp, pop, countUp)
- 📱 Fully responsive (mobile + desktop)
- 🌑 Dark mode only

---

## File Structure

```
fittrack-dashboard/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx        ← React entry point
    ├── App.jsx         ← Full dashboard (single-file component)
    └── index.css       ← Tailwind directives
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Production Build

```bash
npm run build
# Output goes to /dist
npm run preview   # preview the production build locally
```

---

## ☁️ Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
# Install Vercel CLI globally (once)
npm i -g vercel

# Deploy from project root
vercel

# Follow the prompts:
# ✔ Set up and deploy? Yes
# ✔ Which scope? (your account)
# ✔ Link to existing project? No → create new
# ✔ Project name: fittrack-dashboard
# ✔ In which directory is your code located? ./
# Vercel auto-detects Vite — no extra config needed!
```

### Option B — GitHub + Vercel dashboard

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Framework preset: **Vite** (auto-detected)
5. Click **Deploy** — done!

> Vercel automatically sets `npm run build` as the build command and `dist` as the output directory for Vite projects.

---

## 🧮 MET Formula

```
calories = MET × weight(kg) × time(hours)
```

| Exercise | MET |
|----------|-----|
| Running  | 8.0 |
| Walking  | 3.5 |
| Cycling  | 6.0 |
| Gym      | 5.0 |

---

## 📦 Dependencies

| Package   | Purpose                     |
|-----------|-----------------------------|
| react      | UI framework               |
| react-dom  | DOM renderer               |
| recharts   | Bar chart component        |
| tailwindcss | Utility-first CSS         |
| vite       | Build tool & dev server    |
