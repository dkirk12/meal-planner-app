# Meal Planner App

A modern, **iOS/macOS-inspired** meal planning application built in **React + TypeScript** with **Tailwind CSS** and a **persistent local SQLite database** (`sql.js` backed by localStorage).

The app is designed to manage:
- Weekly meal plans
- A master recipe library (with images, coming soon)
- Ingredient tracking for grocery lists
- Past meal plan history
- Meal editing and rerolling features

---

## 🚀 Quick Start
```bash
npm install
npm run dev
```

---

## 🧩 Features

- **Weekly Meal Planning**
  - Add breakfast, lunch, dinner, and dessert for each day
  - Link meals to master recipes for re-use
  - Supports many weeks (schema ready; week picker UI coming)

- **Master Recipe Library**
  - Stores every recipe ever used
  - Sort and search recipes
  - Editable recipes with future image support (`image_url` field ready)
  - iOS-style **large tiles** ready to display images

- **Database Architecture**
  - SQLite (`sql.js`) running in-browser
  - LocalStorage persistence (desktop file persistence planned via Electron)
  - Separate tables for recipes, ingredients, weekly plans, and plan logs

- **UI Design**
  - iOS/macOS-inspired interface
  - Tailwind CSS with soft shadows, rounded corners, and system font stack
  - Bottom tab navigation between **Home** and **Recipes**

---

## 🛠 Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** SQLite via `sql.js` (LocalStorage persistence)
- **State:** Local React state (future: context or Zustand)
- **Future:** Electron/Capacitor for desktop/mobile packaging

---

## 🗂 Project Structure
```
src/
  App.tsx                # Tab navigation (Home, Recipes)
  index.css              # Tailwind styles
  db/
    index.ts             # DB init, persistence, CRUD (recipes, search, update)
    schema.ts            # Schema definition
  components/
    TabBar.tsx           # Bottom navigation
    RecipeCard.tsx       # Recipe tile component
  pages/
    Home.tsx             # Weekly plan UI
    Recipes.tsx          # Recipe library UI with sorting/search/Add
  models/
    types.ts             # TypeScript interfaces
  utils/
    id.ts                # recipeId generator (first digit encodes mealType)
```

---

## 📈 Version History & Update Notes

### **v0.3.1 – README + Docs Update**
- Added this **README.md** with Quick Start, Features, Tech Stack, Structure, and Version History.
- Documented the agent’s role and roadmap.
- No code changes required; safe to apply as a standalone patch.

### **v0.3.0 – Recipe Library Overhaul**
- **DB:** New schema to support long-term scale
  - `recipes` (master list, with `image_url` placeholder)
  - `ingredients` (global list)
  - `recipe_ingredients` (junction with quantities)
  - `meals` (instances placed in plans)
  - `weekly_meal_plans` and `day_meals` (multi-week)
  - `plan_log` for snapshots/history
- **UI:** Second tab **Recipes** with:
  - Search input and sort dropdown (name asc/desc, recently added)
  - **+ Add Recipe** modal
  - iOS-style **RecipeCard** large tiles (image-ready)
- **APIs:** `getAllRecipes`, `searchRecipesByName`, `addRecipe`, `updateRecipe`

### **v0.2.0 – DB + Weekly Plan Seed**
- Added `sql.js` integration with LocalStorage persistence
- Seeded week of **Aug 18–24, 2025** using selected meals
- “Save Now” button and auto-save on page unload

### **v0.1.0 – Initial Setup**
- React + TypeScript + Vite baseline
- Tailwind configured, iOS-inspired base styling
- Minimal App placeholder

---

## 🧭 Roadmap
- **Recipe Detail / Edit** modal
- **Image support** (generate/upload) wired to `recipes.image_url`
- **Week picker** and “duplicate week”
- **Grocery list generator** (general vs. by-meal)
- **Ingredient usage tracking**
- **Reroll** button for random meal swaps within ingredient constraints
- **Export/Import** of DB snapshots

---

## 🤝 Assistant’s Role
I’ve been acting as:
- **Architect:** Multi-table schema design for scalability
- **Engineer:** Implemented SQLite persistence, CRUD, and seed logic
- **Designer:** iOS/macOS-inspired UI with Tailwind and tiles
- **PM:** Version history, update notes, and roadmap maintenance
- **Tech Support:** Provided ready-to-run zips and troubleshooting steps (Windows/PowerShell)

---

## 🧪 Tips
- If the seed doesn’t appear after applying patches, clear the saved DB once:
  - Browser DevTools → Application → Local Storage → remove `mealPlanner.sqlite`
  - Refresh the app
- Use the Recipes tab to add a new recipe and test the ID scheme.
