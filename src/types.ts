export type Gender = 'male' | 'female';

export type MealSlot =
  | 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack'
  | 'dinner' | 'evening_snack' | 'late_night';

export const MEAL_SLOTS: { key: MealSlot; label: string; emoji: string }[] = [
  { key: 'breakfast', label: '아침', emoji: '🌅' },
  { key: 'morning_snack', label: '오전 간식', emoji: '☕' },
  { key: 'lunch', label: '점심', emoji: '🍱' },
  { key: 'afternoon_snack', label: '오후 간식', emoji: '🍪' },
  { key: 'dinner', label: '저녁', emoji: '🍽️' },
  { key: 'evening_snack', label: '저녁 간식', emoji: '🍷' },
  { key: 'late_night', label: '야식', emoji: '🌙' },
];

export interface Nutrients {
  calories: number;
  carbs: number;       // g
  protein: number;     // g
  fat: number;         // g
  saturated: number;   // g 포화지방
  unsaturated: number; // g 단+다불포화지방 합계
  poly: number;        // g (deprecated, kept for backwards compatibility)
  mono: number;        // g (deprecated, kept for backwards compatibility)
  trans: number;       // g 트랜스지방
  cholesterol: number; // mg
  sodium: number;      // mg
  fiber: number;       // g
  sugar: number;       // g
}

export interface FoodEntry {
  id: string;
  name: string;
  slot: MealSlot;
  date: string; // YYYY-MM-DD
  servings: number;
  nutrients: Nutrients;
  createdAt: number;
}

export const EMPTY_NUTRIENTS: Nutrients = {
  calories: 0, carbs: 0, protein: 0, fat: 0, saturated: 0, unsaturated: 0,
  poly: 0, mono: 0, trans: 0, cholesterol: 0, sodium: 0, fiber: 0, sugar: 0,
};
