import { create } from "zustand";
import type { FilterState, MapState } from "@/types";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_LEVEL = 6;

type SidebarView = "list" | "detail" | "compare";

interface AppStore {
  map: MapState;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapLevel: (level: number) => void;
  focusLocation: (lat: number, lng: number) => void;

  visibleGus: string[];
  setVisibleGus: (gus: string[]) => void;

  // 사이드바 뷰 모드
  sidebarView: SidebarView;
  setSidebarView: (view: SidebarView) => void;

  // 선택한 동 (배지 클릭 → detail view)
  selectedDong: string | null;
  setSelectedDong: (dong: string | null) => void;

  // 비교 대상 (최대 2개)
  compareDongs: string[];
  toggleCompareDong: (dong: string) => void;
  clearCompare: () => void;

  filter: FilterState;
  setFilter: (filter: Partial<FilterState>) => void;

  isSidebarOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;

  areaUnit: "sqm" | "pyeong";
  toggleAreaUnit: () => void;
}

const initialFilter: FilterState = {
  region: "",
  dealType: "전체",
  monthlyRentRange: [0, 200],
  wolseDepositRange: [0, 50000],
  jeonseDepositRange: [0, 50000],
  areaRange: [0, 100],
  yearRange: [2024, 2026],
};

export const useAppStore = create<AppStore>((set, get) => ({
  map: { center: DEFAULT_CENTER, level: DEFAULT_LEVEL },
  setMapCenter: (center) => set((s) => ({ map: { ...s.map, center } })),
  setMapLevel: (level) => set((s) => ({ map: { ...s.map, level } })),
  focusLocation: (lat, lng) => set({ map: { center: { lat, lng }, level: 3 } }),

  visibleGus: [],
  setVisibleGus: (gus) => set({ visibleGus: gus }),

  sidebarView: "list",
  setSidebarView: (view) => set({ sidebarView: view }),

  selectedDong: null,
  setSelectedDong: (dong) => set((s) => ({
    selectedDong: dong,
    sidebarView: dong ? "detail" : "list",
    // 선택한 동이 비교 목록에 있으면 비교에서 제거
    compareDongs: dong ? s.compareDongs.filter((d) => d !== dong) : s.compareDongs,
  })),

  compareDongs: [],
  toggleCompareDong: (dong) => {
    const { compareDongs } = get();
    if (compareDongs.includes(dong)) {
      set({ compareDongs: compareDongs.filter((d) => d !== dong) });
    } else if (compareDongs.length < 2) {
      const next = [...compareDongs, dong];
      set({
        compareDongs: next,
        sidebarView: next.length === 2 ? "compare" : get().sidebarView,
      });
    }
  },
  clearCompare: () => set({ compareDongs: [], sidebarView: "list" }),

  filter: initialFilter,
  setFilter: (partial) => set((s) => ({ filter: { ...s.filter, ...partial } })),

  isSidebarOpen: true,
  sidebarWidth: 380,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(300, Math.min(600, w)) }),

  areaUnit: "sqm",
  toggleAreaUnit: () => set((s) => ({ areaUnit: s.areaUnit === "sqm" ? "pyeong" : "sqm" })),
}));
