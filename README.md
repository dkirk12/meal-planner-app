# Meal Planner App (v0.4.0)

A modern, iOS/macOS-inspired meal planning app in React + TypeScript + Tailwind with SQLite (sql.js) persisted to localStorage.

## Quick Start
```bash
npm install
npm run dev
```

## Highlights
- Split DB architecture:
  - Recipes DB (mealType-prefixed IDs, placeholder images)
  - Ingredients DB (sequential IDs like I00001)
- Weekly plan stored as a JSON object referencing recipe IDs
- Two tabs: Home (plan) and Recipes (library with search/sort/add)

## Version History
- **v0.4.0** – Split DBs + Plan JSON + full project scaffold
- **v0.3.1** – README & docs
- **v0.3.0** – Recipe library overhaul
- **v0.2.0** – DB + weekly seed
- **v0.1.0** – Initial setup
