import initSqlJs, { Database } from 'sql.js';
/* @ts-ignore */
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { schemaSQL } from './schema';
import type { WeeklyMealPlan, DayOfWeek, MealType } from '../models/types';
import { generateRecipeId, uuid } from '../utils/id';

const LS_KEY = 'mealPlanner.sqlite';

export async function openDb(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });

  // Restore from localStorage if present
  const bytesB64 = localStorage.getItem(LS_KEY);
  let db: Database;
  if (bytesB64) {
    const bytes = Uint8Array.from(atob(bytesB64), c => c.charCodeAt(0));
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }

  db.run(schemaSQL);
  return db;
}

export function persistDb(db: Database) {
  const data = db.export();
  const b64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(LS_KEY, b64);
}

export function attachAutoPersist(db: Database) {
  const handler = () => persistDb(db);
  window.addEventListener('beforeunload', handler);
  const id = window.setInterval(() => persistDb(db), 60_000);
  return () => {
    window.removeEventListener('beforeunload', handler);
    window.clearInterval(id);
  };
}

/** Seed only if there are no meals or recipes, using the user's SELECTED recipes. */
export function seedIfEmpty(db: Database) {
  const checkR = db.exec("SELECT COUNT(*) as n FROM recipes");
  const nr = checkR.length ? (checkR[0].values[0][0] as number) : 0;
  const checkM = db.exec("SELECT COUNT(*) as n FROM meals");
  const nm = checkM.length ? (checkM[0].values[0][0] as number) : 0;
  if (nr > 0 && nm > 0) return;

  // --- Ingredient catalog (sparse, can be expanded) ---
  const ING = [
    ['ing_banana','Banana','Produce'],
    ['ing_proteinbar','Protein bar','Snacks'],
    ['ing_turkey','Lean ground turkey','Meat'],
    ['ing_greens','Mixed greens','Produce'],
    ['ing_corn','Corn','Canned'],
    ['ing_blackbeans','Black beans','Canned'],
    ['ing_beef','Beef','Meat'],
    ['ing_sweetpotato','Sweet potato','Produce'],
    ['ing_onion','Onion','Produce'],
    ['ing_bellpepper','Bell pepper','Produce'],
    ['ing_garlic','Garlic','Produce'],
    ['ing_kidneybeans','Kidney beans','Canned'],
    ['ing_cornbreadmix','Cornbread mix','Bakery'],
    ['ing_cheese','Cheese (shredded)','Dairy'],
    ['ing_tortilla','Whole wheat tortilla','Bakery'],
    ['ing_chicken','Chicken breast','Meat'],
    ['ing_parmesan','Parmesan','Dairy'],
    ['ing_romaine','Romaine','Produce'],
    ['ing_caesardress','Caesar dressing','Condiments'],
    ['ing_bread','Bread','Bakery'],
    ['ing_egg','Eggs','Dairy'],
    ['ing_bacon','Bacon','Meat'],
    ['ing_potato','Potato','Produce'],
    ['ing_bluecheese','Blue cheese','Dairy'],
    ['ing_mixedgreens','Mixed greens','Produce'],
    ['ing_nuts','Walnuts/Pecans','Bulk'],
    ['ing_avocado','Avocado','Produce'],
    ['ing_berries','Berries','Produce'],
    ['ing_oats','Rolled oats','Grains'],
    ['ing_milk','Milk','Dairy'],
    ['ing_basil','Basil','Produce'],
    ['ing_mozz','Mozzarella','Dairy'],
    ['ing_ciabatta','Ciabatta','Bakery'],
    ['ing_steak','Steak','Meat'],
    ['ing_greenbeans','Green beans','Produce'],
    ['ing_pulledpork','Pulled pork','Meat'],
    ['ing_buns','Buns','Bakery'],
    ['ing_cabbage','Cabbage','Produce'],
    ['ing_chicken_thigh','Chicken thighs','Meat'],
    ['ing_frozenpeas','Frozen peas','Frozen'],
    ['ing_piecrust','Pie crust','Frozen'],
    ['ing_yogurt','Greek yogurt','Dairy'],
    ['ing_honey','Honey','Condiments'],
  ] as const;
  const insIng = db.prepare("INSERT OR IGNORE INTO ingredients (id,name,store_section) VALUES (?,?,?)");
  ING.forEach(([id,name,sec]) => insIng.run([id,name,sec]));
  insIng.free();

  // Helper to insert recipe (master) + meal instance + link ingredients
  function insertRecipe(opts: {
    name: string,
    type: MealType,
    instructions: string[],
    ingredients: Array<[string, number, string]>,
    image_url?: string
  }){
    const recipeId = generateRecipeId(opts.type);
    db.run(`INSERT OR IGNORE INTO recipes (id,name,instructions,prep_time_minutes,notes,image_url) VALUES (?,?,?,?,?,?)`,
      [recipeId, opts.name, JSON.stringify(opts.instructions), null, null, opts.image_url ?? null]);

    const mealId = uuid('meal');
    db.run(`INSERT OR IGNORE INTO meals (id,name,type,recipe_id) VALUES (?,?,?,?)`,
      [mealId, opts.name, opts.type, recipeId]);

    const stmt = db.prepare("INSERT OR REPLACE INTO recipe_ingredients (recipe_id,ingredient_id,quantity,unit) VALUES (?,?,?,?)");
    opts.ingredients.forEach(([ing, q, u]) => stmt.run([recipeId, ing, q, u]));
    stmt.free();
    return { recipeId, mealId };
  }

  // Create week 2025-08-18
  const start = '2025-08-18';
  const dates: Record<DayOfWeek,string> = {
    Monday: '2025-08-18',
    Tuesday: '2025-08-19',
    Wednesday: '2025-08-20',
    Thursday: '2025-08-21',
    Friday: '2025-08-22',
    Saturday: '2025-08-23',
    Sunday: '2025-08-24',
  };
  db.run("INSERT OR IGNORE INTO weekly_meal_plans (start_date) VALUES (?)", [start]);
  for (const day in dates){
    const d = (dates as any)[day];
    db.run("INSERT OR IGNORE INTO day_plans (date,week_start_date) VALUES (?,?)", [d, start]);
  }

  // Selected recipes (master) + place into the week
  const map: Array<[string, MealType, string]> = [];

  function place(day: string, type: MealType, mealId: string){
    db.run("INSERT OR REPLACE INTO day_meals (day_date, meal_type, meal_id) VALUES (?,?,?)", [day, type, mealId]);
  }

  // Monday
  const { mealId: monB } = insertRecipe({
    name: 'Greek Yogurt with Honey & Berries',
    type: 'Breakfast',
    instructions: ['Spoon yogurt into bowl. Top with berries. Drizzle honey.'],
    ingredients: [
      ['ing_yogurt', 1, 'cup'],
      ['ing_berries', 0.5, 'cup'],
      ['ing_honey', 1, 'tbsp']
    ]
  }); place(dates.Monday, 'Breakfast', monB);

  const { mealId: monL } = insertRecipe({
    name: 'Turkey Taco Salad',
    type: 'Lunch',
    instructions: ['Brown turkey with taco seasoning. Combine greens, corn, beans. Top with turkey.'],
    ingredients: [
      ['ing_turkey', 6, 'oz'],
      ['ing_greens', 3, 'cups'],
      ['ing_corn', 0.5, 'cup'],
      ['ing_blackbeans', 0.5, 'cup']
    ]
  }); place(dates.Monday, 'Lunch', monL);

  const { mealId: monD } = insertRecipe({
    name: 'Beef & Sweet Potato Chili (with beans) + Cornbread + Cheese',
    type: 'Dinner',
    instructions: ['Sauté onion/pepper/garlic. Brown beef. Add beans, sweet potato, simmer. Bake cornbread.'],
    ingredients: [
      ['ing_beef', 16, 'oz'],
      ['ing_onion', 1, 'unit'],
      ['ing_bellpepper', 1, 'unit'],
      ['ing_garlic', 2, 'clove'],
      ['ing_kidneybeans', 1, 'can'],
      ['ing_blackbeans', 1, 'can'],
      ['ing_sweetpotato', 1, 'unit'],
      ['ing_cornbreadmix', 1, 'box'],
      ['ing_cheese', 1, 'cup']
    ]
  }); place(dates.Monday, 'Dinner', monD);

  // Tuesday
  const { mealId: tueB } = insertRecipe({
    name: 'Overnight Oats with Berries & Honey',
    type: 'Breakfast',
    instructions: ['Mix oats with milk; refrigerate. Top with berries & honey.'],
    ingredients: [
      ['ing_oats', 0.5, 'cup'],
      ['ing_milk', 1, 'cup'],
      ['ing_berries', 0.5, 'cup'],
      ['ing_honey', 1, 'tbsp']
    ]
  }); place(dates.Tuesday, 'Breakfast', tueB);

  const { mealId: tueL } = insertRecipe({
    name: 'Beef & Sweet Potato Bowl (with broccoli)',
    type: 'Lunch',
    instructions: ['Roast sweet potatoes. Cook beef. Assemble with veg.'],
    ingredients: [
      ['ing_beef', 8, 'oz'],
      ['ing_sweetpotato', 1, 'unit']
    ]
  }); place(dates.Tuesday, 'Lunch', tueL);

  const { mealId: tueD } = insertRecipe({
    name: 'Pasta with Meatballs + Garlic Bread',
    type: 'Dinner',
    instructions: ['Bake meatballs. Boil pasta. Toast garlic bread.'],
    ingredients: [
      ['ing_beef', 16, 'oz'],
      ['ing_bread', 1, 'loaf'],
      ['ing_parmesan', 0.5, 'cup']
    ]
  }); place(dates.Tuesday, 'Dinner', tueD);

  // Wednesday
  const { mealId: wedB } = insertRecipe({
    name: 'Peanut Butter & Banana Toast',
    type: 'Breakfast',
    instructions: ['Toast bread. Add peanut butter. Top with banana.'],
    ingredients: [
      ['ing_bread', 2, 'slices'],
      ['ing_banana', 1, 'unit']
    ]
  }); place(dates.Wednesday, 'Breakfast', wedB);

  const { mealId: wedL } = insertRecipe({
    name: 'Southwest Chicken Wrap',
    type: 'Lunch',
    instructions: ['Grill chicken. Fill tortilla with greens, corn, beans, chicken.'],
    ingredients: [
      ['ing_chicken', 6, 'oz'],
      ['ing_tortilla', 1, 'unit'],
      ['ing_greens', 2, 'cups'],
      ['ing_corn', 0.5, 'cup'],
      ['ing_blackbeans', 0.5, 'cup']
    ]
  }); place(dates.Wednesday, 'Lunch', wedL);

  const { mealId: wedD } = insertRecipe({
    name: 'Stuffed Chicken Breast (spinach & cheese) + Roasted Carrots & Green Beans',
    type: 'Dinner',
    instructions: ['Stuff chicken; bake. Roast carrots & green beans.'],
    ingredients: [
      ['ing_chicken', 8, 'oz'],
      ['ing_cheese', 0.5, 'cup'],
      ['ing_greenbeans', 2, 'cups']
    ]
  }); place(dates.Wednesday, 'Dinner', wedD);

  // Thursday
  const { mealId: thuB } = insertRecipe({
    name: 'Protein Shake + Peanut Butter + Apple',
    type: 'Breakfast',
    instructions: ['Shake protein with milk/water. Spoon PB. Eat apple.'],
    ingredients: [
      ['ing_milk', 1, 'cup']
    ]
  }); place(dates.Thursday, 'Breakfast', thuB);

  const { mealId: thuL } = insertRecipe({
    name: 'Grilled Chicken Caesar Salad',
    type: 'Lunch',
    instructions: ['Grill chicken; toss romaine with dressing & Parmesan; top with chicken.'],
    ingredients: [
      ['ing_chicken', 6, 'oz'],
      ['ing_romaine', 4, 'cups'],
      ['ing_caesardress', 0.25, 'cup'],
      ['ing_parmesan', 0.25, 'cup']
    ]
  }); place(dates.Thursday, 'Lunch', thuL);

  const { mealId: thuD } = insertRecipe({
    name: 'Pasta with Meatballs + Garlic Bread (repeat)',
    type: 'Dinner',
    instructions: ['Reheat or make fresh.'],
    ingredients: [
      ['ing_beef', 16, 'oz'],
      ['ing_bread', 1, 'loaf'],
      ['ing_parmesan', 0.5, 'cup']
    ]
  }); place(dates.Thursday, 'Dinner', thuD);

  // Friday
  const { mealId: friB } = insertRecipe({
    name: 'Eggs, Hashbrowns, Bacon',
    type: 'Breakfast',
    instructions: ['Cook bacon. Cook hashbrowns. Fry/scramble eggs.'],
    ingredients: [
      ['ing_bacon', 4, 'slices'],
      ['ing_potato', 2, 'unit'],
      ['ing_egg', 3, 'unit']
    ]
  }); place(dates.Friday, 'Breakfast', friB);

  const { mealId: friL } = insertRecipe({
    name: 'Blue Cheese–Loaded Steak Salad',
    type: 'Lunch',
    instructions: ['Grill steak. Toss greens with nuts, avocado, blue cheese.'],
    ingredients: [
      ['ing_steak', 8, 'oz'],
      ['ing_mixedgreens', 3, 'cups'],
      ['ing_bluecheese', 0.75, 'cup'],
      ['ing_nuts', 0.25, 'cup'],
      ['ing_avocado', 1, 'unit']
    ]
  }); place(dates.Friday, 'Lunch', friL);

  const { mealId: friD } = insertRecipe({
    name: 'Spaghetti Carbonara',
    type: 'Dinner',
    instructions: ['Cook pasta. Render pancetta/bacon. Toss with eggs & Parmesan off heat.'],
    ingredients: [
      ['ing_parmesan', 0.5, 'cup'],
      ['ing_bacon', 6, 'slices']
    ]
  }); place(dates.Friday, 'Dinner', friD);

  // Saturday
  const { mealId: satB } = insertRecipe({
    name: 'Overnight Oats with Berries & Honey',
    type: 'Breakfast',
    instructions: ['Mix oats with milk; refrigerate. Top with berries & honey.'],
    ingredients: [
      ['ing_oats', 0.5, 'cup'],
      ['ing_milk', 1, 'cup'],
      ['ing_berries', 1, 'cup']
    ]
  }); place(dates.Saturday, 'Breakfast', satB);

  const { mealId: satL } = insertRecipe({
    name: 'Caprese Sandwich',
    type: 'Lunch',
    instructions: ['Layer mozzarella and basil on ciabatta. (Tomato optional.) Drizzle balsamic.'],
    ingredients: [
      ['ing_mozz', 4, 'oz'],
      ['ing_basil', 0.25, 'cup'],
      ['ing_ciabatta', 1, 'loaf']
    ]
  }); place(dates.Saturday, 'Lunch', satL);

  const { mealId: satD } = insertRecipe({
    name: 'Grilled Steak + Garlic Mash + Green Beans',
    type: 'Dinner',
    instructions: ['Grill steak. Make mashed potatoes with garlic. Steam green beans.'],
    ingredients: [
      ['ing_steak', 10, 'oz'],
      ['ing_potato', 3, 'unit'],
      ['ing_garlic', 3, 'clove'],
      ['ing_greenbeans', 2, 'cups']
    ]
  }); place(dates.Saturday, 'Dinner', satD);

  // Sunday
  const { mealId: sunB } = insertRecipe({
    name: 'French Toast with Berries & Maple',
    type: 'Breakfast',
    instructions: ['Dip bread in egg/milk mixture and fry. Top with berries & syrup.'],
    ingredients: [
      ['ing_bread', 2, 'slices'],
      ['ing_egg', 2, 'unit'],
      ['ing_berries', 1, 'cup']
    ]
  }); place(dates.Sunday, 'Breakfast', sunB);

  const { mealId: sunL } = insertRecipe({
    name: 'Pulled Pork Sandwich with Coleslaw',
    type: 'Lunch',
    instructions: ['Warm pulled pork. Assemble on buns with slaw.'],
    ingredients: [
      ['ing_pulledpork', 8, 'oz'],
      ['ing_buns', 2, 'unit'],
      ['ing_cabbage', 1, 'unit']
    ]
  }); place(dates.Sunday, 'Lunch', sunL);

  const { mealId: sunD } = insertRecipe({
    name: 'Chicken Pot Pie',
    type: 'Dinner',
    instructions: ['Cook filling with chicken, carrots, peas; bake with pie crust.'],
    ingredients: [
      ['ing_chicken_thigh', 16, 'oz'],
      ['ing_potato', 1, 'unit'],
      ['ing_frozenpeas', 1, 'cup'],
      ['ing_piecrust', 1, 'unit']
    ]
  }); place(dates.Sunday, 'Dinner', sunD);
}

/* --- QUERIES & CRUD for Recipes --- */
export type RecipeSort = 'name_asc'|'name_desc'|'recent_added';

export function getAllRecipes(db: Database, sort: RecipeSort = 'name_asc'){
  let order = 'ORDER BY name ASC';
  if (sort === 'name_desc') order = 'ORDER BY name DESC';
  if (sort === 'recent_added') order = 'ORDER BY rowid DESC';
  const res = db.exec(`SELECT id, name, prep_time_minutes, notes, image_url FROM recipes ${order}`);
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(v => Object.fromEntries(cols.map((c,i)=>[c,v[i]])));
}

export function searchRecipesByName(db: Database, q: string){
  const like = `%${q}%`;
  const stmt = db.prepare(`SELECT id, name, prep_time_minutes, notes, image_url FROM recipes WHERE name LIKE ? ORDER BY name ASC`);
  const out:any[] = [];
  stmt.bind([like]);
  while (stmt.step()) out.push(stmt.getAsObject());
  stmt.free();
  return out;
}

export function addRecipe(db: Database, opts: {
  name: string,
  type: MealType,
  instructions?: string[],
  ingredients?: Array<{ ingredientId: string, quantity: number, unit: string }>,
  image_url?: string,
  notes?: string,
  prep_time_minutes?: number
}){
  const recipeId = generateRecipeId(opts.type);
  db.run(`INSERT INTO recipes (id,name,instructions,prep_time_minutes,notes,image_url) VALUES (?,?,?,?,?,?)`,
    [recipeId, opts.name, JSON.stringify(opts.instructions ?? []), opts.prep_time_minutes ?? null, opts.notes ?? null, opts.image_url ?? null]);
  if (opts.ingredients?.length){
    const stmt = db.prepare("INSERT OR REPLACE INTO recipe_ingredients (recipe_id,ingredient_id,quantity,unit) VALUES (?,?,?,?)");
    opts.ingredients.forEach(it => stmt.run([recipeId, it.ingredientId, it.quantity, it.unit]));
    stmt.free();
  }
  return recipeId;
}

export function updateRecipe(db: Database, opts: {
  id: string,
  name?: string,
  instructions?: string[],
  image_url?: string,
  notes?: string,
  prep_time_minutes?: number
}){
  const prev = db.prepare("SELECT * FROM recipes WHERE id = ?");
  prev.bind([opts.id]);
  if (!prev.step()){ prev.free(); throw new Error('Recipe not found'); }
  const cur = prev.getAsObject() as any;
  prev.free();
  const name = opts.name ?? cur.name;
  const instructions = JSON.stringify(opts.instructions ?? JSON.parse(cur.instructions ?? '[]'));
  const image_url = opts.image_url ?? cur.image_url;
  const notes = opts.notes ?? cur.notes;
  const ptm = (opts.prep_time_minutes ?? cur.prep_time_minutes) as any;
  db.run("UPDATE recipes SET name=?, instructions=?, image_url=?, notes=?, prep_time_minutes=? WHERE id=?",
    [name, instructions, image_url, notes, ptm, opts.id]);
}

export function getWeeklyPlan(db: Database, startDate: string): WeeklyMealPlan {
  const plan: WeeklyMealPlan = {
    startDate,
    days: { Monday:{}, Tuesday:{}, Wednesday:{}, Thursday:{}, Friday:{}, Saturday:{}, Sunday:{} }
  } as WeeklyMealPlan;

  const stmt = db.prepare(`
    SELECT dp.date, dm.meal_type, m.id, m.name, m.type
    FROM day_plans dp
    LEFT JOIN day_meals dm ON dm.day_date = dp.date
    LEFT JOIN meals m ON m.id = dm.meal_id
    WHERE dp.week_start_date = ?
    ORDER BY dp.date
  `);
  stmt.bind([startDate]);
  while (stmt.step()){
    const row = stmt.getAsObject() as any;
    const date = row.date as string;
    const day = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) as keyof WeeklyMealPlan['days'];
    if (!row.meal_type) continue;
    const mt = row.meal_type as 'Breakfast'|'Lunch'|'Dinner'|'Dessert'|'Snack';
    plan.days[day][mt] = {
      id: row.id, name: row.name, type: row.type, ingredients: []
    } as any;
  }
  stmt.free();
  return plan;
}
