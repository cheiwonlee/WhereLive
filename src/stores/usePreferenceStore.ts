import { create } from "zustand";

export interface UserPreferences {
  // 예산
  budget: number; // 월 실수령액 (만원)
  preferredType: "전세" | "월세" | "상관없음";

  // 가중치 (0~100, 합계 무관 — 비율로 정규화)
  weights: {
    affordability: number;  // 가격 가성비
    transport: number;      // 대중교통
    safety: number;         // 치안/안전
    convenience: number;    // 편의시설
    quiet: number;          // 조용한 환경
  };

  // 개인 정보
  hasOwnCar: boolean;
  age: number; // 0이면 미입력
}

const defaultPreferences: UserPreferences = {
  budget: 0,
  preferredType: "상관없음",
  weights: {
    affordability: 80,
    transport: 70,
    safety: 60,
    convenience: 50,
    quiet: 30,
  },
  hasOwnCar: false,
  age: 0,
};

interface PreferenceStore {
  prefs: UserPreferences;
  setPrefs: (p: Partial<UserPreferences>) => void;
  setWeight: (key: keyof UserPreferences["weights"], val: number) => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

export const usePreferenceStore = create<PreferenceStore>((set) => ({
  prefs: defaultPreferences,
  setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
  setWeight: (key, val) =>
    set((s) => ({
      prefs: { ...s.prefs, weights: { ...s.prefs.weights, [key]: val } },
    })),
  isOpen: false,
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
}));
