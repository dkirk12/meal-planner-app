export const schemaSQL = `
PRAGMA foreign_keys = ON;

/* INGREDIENTS DB (master list) */
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  store_section TEXT,
  available_at_work INTEGER DEFAULT 0
);

/* RECIPES DB (master recipes list) */
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  instructions TEXT,         -- JSON array of steps
  prep_time_minutes INTEGER,
  notes TEXT,
  image_url TEXT             -- reserved for future images
);

/* Junction: recipes <-> ingredients with quantities */
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  PRIMARY KEY (recipe_id, ingredient_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

/* MEAL INSTANCES (used to place recipes on calendars) */
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,        -- cached for display; link to recipe_id
  type TEXT NOT NULL,        -- Breakfast, Lunch, Dinner, Dessert, Snack
  recipe_id TEXT,
  notes TEXT,
  is_meal_prep INTEGER DEFAULT 0,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
);

/* WEEKLY PLANS (supports many weeks) */
CREATE TABLE IF NOT EXISTS weekly_meal_plans (
  start_date TEXT PRIMARY KEY   -- ISO date string, Monday of week
);

CREATE TABLE IF NOT EXISTS day_plans (
  date TEXT PRIMARY KEY,        -- ISO date for the day
  week_start_date TEXT NOT NULL,
  FOREIGN KEY (week_start_date) REFERENCES weekly_meal_plans(start_date) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS day_meals (
  day_date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  meal_id TEXT NOT NULL,
  PRIMARY KEY (day_date, meal_type),
  FOREIGN KEY (day_date) REFERENCES day_plans(date) ON DELETE CASCADE,
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
);

/* PAST MEAL PLANS LOG (historical snapshots for analytics) */
CREATE TABLE IF NOT EXISTS plan_log (
  id TEXT PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  created_at TEXT NOT NULL,         -- ISO datetime
  snapshot_json TEXT NOT NULL       -- serialized WeeklyMealPlan
);
`;
