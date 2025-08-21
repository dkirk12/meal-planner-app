import initSqlJs, { Database } from 'sql.js';
/* @ts-ignore */
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { MealType } from '../models/plan';

export const RECIPES_LS_KEY = 'mealPlanner.recipes.sqlite';
export const PLACEHOLDER_URL = 'https://via.placeholder.com/600x400?text=Recipe+Image';

const mealTypeCodeMap: Record<MealType, string> = {
  Breakfast: '1',
  Lunch: '2',
  Dinner: '3',
  Dessert: '4',
  Snack: '5',
};

export function generateRecipeId(mealType: MealType): string {
  const head = mealTypeCodeMap[mealType];
  const tail = (Date.now() % 100000).toString().padStart(5, '0');
  return `${head}${tail}`;
}

export async function openRecipesDb(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const bytesB64 = localStorage.getItem(RECIPES_LS_KEY);
  let db: Database;
  if (bytesB64) {
    const bytes = Uint8Array.from(atob(bytesB64), c => c.charCodeAt(0));
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }
  db.run(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      meal_type TEXT NOT NULL,
      instructions TEXT,
      prep_time_minutes INTEGER,
      notes TEXT,
      image_url TEXT
    );
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      recipe_id TEXT NOT NULL,
      ingredient_id TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      PRIMARY KEY (recipe_id, ingredient_id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );
  `);
  ensureRecipeImages(db);
  return db;
}

export function persistRecipesDb(db: Database){
  const data = db.export();
  const b64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(RECIPES_LS_KEY, b64);
}

export function ensureRecipeImages(db: Database){
  db.run("UPDATE recipes SET image_url = ? WHERE image_url IS NULL OR image_url = ''", [PLACEHOLDER_URL]);
}

export type RecipeRow = {
  id: string; name: string; meal_type: MealType; prep_time_minutes?: number|null;
  notes?: string|null; image_url?: string|null;
};

export type RecipeSort = 'name_asc'|'name_desc'|'recent_added';

export function getAllRecipes(db: Database, sort: RecipeSort = 'name_asc'): RecipeRow[]{
  let order = 'ORDER BY name ASC';
  if (sort === 'name_desc') order = 'ORDER BY name DESC';
  if (sort === 'recent_added') order = 'ORDER BY rowid DESC';
  const res = db.exec(`SELECT id,name,meal_type,prep_time_minutes,notes,image_url FROM recipes ${order}`);
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(v => Object.fromEntries(cols.map((c,i)=>[c,v[i]]))) as any;
}

export function searchRecipesByName(db: Database, q: string): RecipeRow[]{
  const like = `%${q}%`;
  const stmt = db.prepare(`SELECT id,name,meal_type,prep_time_minutes,notes,image_url FROM recipes WHERE name LIKE ? ORDER BY name ASC`);
  const out:any[] = [];
  stmt.bind([like]);
  while (stmt.step()) out.push(stmt.getAsObject());
  stmt.free();
  return out as any;
}

export function addRecipe(db: Database, opts: {
  name: string,
  meal_type: MealType,
  instructions?: string[],
  ingredients?: Array<{ ingredientId: string, quantity: number, unit: string }>,
  image_url?: string,
  notes?: string,
  prep_time_minutes?: number
}): string {
  const id = generateRecipeId(opts.meal_type);
  const imageUrl = opts.image_url ?? PLACEHOLDER_URL;
  db.run(`INSERT INTO recipes (id,name,meal_type,instructions,prep_time_minutes,notes,image_url) VALUES (?,?,?,?,?,?,?)`,
    [id, opts.name, opts.meal_type, JSON.stringify(opts.instructions ?? []), opts.prep_time_minutes ?? null, opts.notes ?? null, imageUrl]);
  if (opts.ingredients?.length){
    const stmt = db.prepare("INSERT OR REPLACE INTO recipe_ingredients (recipe_id,ingredient_id,quantity,unit) VALUES (?,?,?,?)");
    opts.ingredients.forEach(it => stmt.run([id, it.ingredientId, it.quantity, it.unit]));
    stmt.free();
  }
  return id;
}

export function updateRecipe(db: Database, opts: {
  id: string,
  name?: string,
  meal_type?: MealType,
  instructions?: string[],
  image_url?: string,
  notes?: string,
  prep_time_minutes?: number
}){
  const prev = db.prepare("SELECT * FROM recipes WHERE id=?");
  prev.bind([opts.id]);
  if (!prev.step()){ prev.free(); throw new Error('Recipe not found'); }
  const cur = prev.getAsObject() as any;
  prev.free();
  const name = opts.name ?? cur.name;
  const meal_type = opts.meal_type ?? cur.meal_type;
  const instructions = JSON.stringify(opts.instructions ?? JSON.parse(cur.instructions ?? '[]'));
  const image_url = opts.image_url ?? cur.image_url;
  const notes = opts.notes ?? cur.notes;
  const ptm = (opts.prep_time_minutes ?? cur.prep_time_minutes) as any;
  db.run("UPDATE recipes SET name=?, meal_type=?, instructions=?, image_url=?, notes=?, prep_time_minutes=? WHERE id=?",
    [name, meal_type, instructions, image_url, notes, ptm, opts.id]);
}
