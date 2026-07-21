import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FoodEntry, Gender, Nutrients, EMPTY_NUTRIENTS } from '../types';

interface AppState {
  gender: Gender | null;
  nickname: string | null;
  setGender: (g: Gender) => void;
  setNickname: (n: string) => void;
  entries: FoodEntry[];
  addEntry: (e: FoodEntry) => void;
  addEntries: (es: FoodEntry[]) => void;
  removeEntry: (id: string) => void;
  hydrate: (entries: FoodEntry[], gender: Gender | null, nickname?: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      gender: null,
      nickname: null,
      setGender: (g) => set({ gender: g }),
      setNickname: (n) => set({ nickname: n }),
      entries: [],
      addEntry: (e) => set((s) => ({ entries: [...s.entries, e] })),
      addEntries: (es) => set((s) => ({ entries: [...s.entries, ...es] })),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((x) => x.id !== id) })),
      hydrate: (entries, gender, nickname) => set({ entries, gender, nickname: nickname ?? null }),
      reset: () => set({ gender: null, nickname: null, entries: [] }),
    }),
    { name: 'clearplate-store' }
  )
);

export function sumNutrients(entries: FoodEntry[]): Nutrients {
  return entries.reduce((acc, e) => {
    const k = Object.keys(acc) as (keyof Nutrients)[];
    k.forEach((key) => (acc[key] += (e.nutrients[key] ?? 0) * e.servings));
    return acc;
  }, { ...EMPTY_NUTRIENTS });
}

export function dailyCalorieTarget(gender: Gender | null): number {
  return gender === 'male' ? 2600 : 2000;
}
