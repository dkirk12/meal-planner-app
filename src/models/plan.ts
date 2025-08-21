export type DayOfWeek = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday';
export type MealType = 'Breakfast'|'Lunch'|'Dinner'|'Dessert'|'Snack';

/** A weekly plan that references recipes by ID from the recipes DB. */
export interface WeeklyMealPlanRef {
  startDate: string; // ISO date string (Monday of the week)
  days: Record<DayOfWeek, Partial<Record<MealType, string>>>; // mealType -> recipeId
}

/** LocalStorage helpers for plans */
const PLAN_KEY_PREFIX = 'mealPlanner.plan.';

export function loadPlan(startDate: string): WeeklyMealPlanRef | null {
  const raw = localStorage.getItem(PLAN_KEY_PREFIX + startDate);
  return raw ? JSON.parse(raw) as WeeklyMealPlanRef : null;
}

export function savePlan(plan: WeeklyMealPlanRef){
  localStorage.setItem(PLAN_KEY_PREFIX + plan.startDate, JSON.stringify(plan));
}

export function createEmptyPlan(startDate: string): WeeklyMealPlanRef {
  return {
    startDate,
    days: {
      Monday:{}, Tuesday:{}, Wednesday:{}, Thursday:{}, Friday:{}, Saturday:{}, Sunday:{}
    }
  };
}
