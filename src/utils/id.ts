import type { MealType } from '../models/types';

const mealTypeCodeMap: Record<MealType, string> = {
  Breakfast: '1',
  Lunch: '2',
  Dinner: '3',
  Dessert: '4',
  Snack: '5',
};

/** First digit encodes mealType. Remaining 5 digits are time-based for low collision risk. */
export function generateRecipeId(mealType: MealType): string {
  const head = mealTypeCodeMap[mealType];
  const tail = (Date.now() % 100000).toString().padStart(5, '0');
  return `${head}${tail}`;
}

export function uuid(prefix='m'): string {
  return `${prefix}_${Math.random().toString(36).slice(2,10)}`;
}
