import initSqlJs, { Database } from 'sql.js';
/* @ts-ignore */
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export const INGREDIENTS_LS_KEY = 'mealPlanner.ingredients.sqlite';

/** Opens or creates the Ingredients DB */
export async function openIngredientsDb(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const bytesB64 = localStorage.getItem(INGREDIENTS_LS_KEY);
  let db: Database;
  if (bytesB64) {
    const bytes = Uint8Array.from(atob(bytesB64), c => c.charCodeAt(0));
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }
  db.run(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,  -- sequential string id (e.g., I00001)
      name TEXT NOT NULL UNIQUE,
      store_section TEXT,
      available_at_work INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS meta (
      k TEXT PRIMARY KEY,
      v TEXT
    );
  `);
  const res = db.exec("SELECT v FROM meta WHERE k='next_ing_num'");
  if (!res.length || !res[0].values.length){
    db.run("INSERT OR REPLACE INTO meta (k,v) VALUES ('next_ing_num','1')");
  }
  return db;
}

export function persistIngredientsDb(db: Database){
  const data = db.export();
  const b64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(INGREDIENTS_LS_KEY, b64);
}

/** Generates the next sequential ingredient ID by reading/storing a counter in the DB. */
export function generateIngredientId(db: Database): string {
  const res = db.exec("SELECT v FROM meta WHERE k='next_ing_num'");
  const cur = res.length && res[0].values.length ? parseInt(res[0].values[0][0] as string, 10) : 1;
  const id = 'I' + String(cur).padStart(5, '0');
  const next = cur + 1;
  db.run("INSERT OR REPLACE INTO meta (k,v) VALUES ('next_ing_num', ?)", [String(next)]);
  return id;
}

export type IngredientRow = { id: string; name: string; store_section?: string|null; available_at_work?: number|null };

export function addIngredient(db: Database, name: string, store_section?: string, available_at_work?: boolean): string {
  const id = generateIngredientId(db);
  db.run("INSERT INTO ingredients (id,name,store_section,available_at_work) VALUES (?,?,?,?)",
    [id, name, store_section ?? null, available_at_work ? 1 : 0]);
  return id;
}

export function getAllIngredients(db: Database): IngredientRow[]{
  const res = db.exec("SELECT id,name,store_section,available_at_work FROM ingredients ORDER BY name ASC");
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(v => Object.fromEntries(cols.map((c,i)=>[c,v[i]]))) as any;
}

export function findIngredientByName(db: Database, q: string): IngredientRow[]{
  const like = `%${q}%`;
  const stmt = db.prepare("SELECT id,name,store_section,available_at_work FROM ingredients WHERE name LIKE ? ORDER BY name ASC");
  const out:any[] = [];
  stmt.bind([like]);
  while (stmt.step()) out.push(stmt.getAsObject());
  stmt.free();
  return out as any;
}
