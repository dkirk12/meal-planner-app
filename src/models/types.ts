export type DayOfWeek = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday';
export type MealType = 'Breakfast'|'Lunch'|'Dinner'|'Dessert'|'Snack';

export interface Ingredient {
  id: string;
  name: string;
  storeSection: string;
  availableAtWork?: boolean;
}

export interface IngredientQuantity {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  instructions: string[];
  ingredients: IngredientQuantity[];
  prepTimeMinutes?: number;
  notes?: string;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  ingredients: IngredientQuantity[];
  recipeId?: string;
  notes?: string;
  isMealPrep?: boolean;
}

export interface DayPlan {
  Breakfast?: Meal;
  Lunch?: Meal;
  Dinner?: Meal;
  Dessert?: Meal;
  Snacks?: Meal[];
}

export interface WeeklyMealPlan {
  startDate: string; // ISO date string
  days: Record<DayOfWeek, DayPlan>;
}
