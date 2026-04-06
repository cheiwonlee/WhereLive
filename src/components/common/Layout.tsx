import { useCallback, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useMultiGuTransactions } from "@/hooks/useRealTransactions";
import { useAllDongClusters } from "@/hooks/useAllDongClusters";
import KakaoMap from "@/components/map/KakaoMap";
import CurrentLocationButton from "@/components/map/CurrentLocationButton";
import FilterBar from "@/components/filter/FilterBar";
import PlaceSearch from "@/components/filter/PlaceSearch";
import HomePage from "@/pages/HomePage";
import DongDetailPanel from "@/components/common/DongDetailPanel";
import ComparePanel from "@/components/common/ComparePanel";

export default function Layout() {
  const {
    isSidebarOpen, sidebarWidth, toggleSidebar, setSidebarWidth,
    sidebarView, setSidebarView,
    selectedDong, visibleGus, filter, compareDongs, clearCompare,
  } = useAppStore();
  const isDragging = useRef(false);

  // 데이터 (Layout에서 한 번만 가져와서 자식에게 전달)
  const { guData } = useMultiGuTransactions(visibleGus);

  const filteredByGu = guData.map(({ gu, transactions }) => ({
    gu,
    items: transactions.filter((item) => {
      if (filter.dealType !== "전체" && item.dealType !== filter.dealType) return false;
      if (item.dealType === "월세") {
        const rent = item.monthlyRent || 0;
        const dep = item.depositAmount || 0;
        if (rent < filter.monthlyRentRange[0] || rent > filter.monthlyRentRange[1]) return false;
        if (dep < filter.wolseDepositRange[0] || dep > filter.wolseDepositRange[1]) return false;
      }
      if (item.dealType === "전세") {
        const dep = item.depositAmount || 0;
        if (dep < filter.jeonseDepositRange[0] || dep > filter.jeonseDepositRange[1]) return false;
      }
      if (item.area < filter.areaRange[0] || item.area > filter.areaRange[1]) return false;
      return true;
    }),
  }));

  const allTransactions = filteredByGu.flatMap((g) => g.items);
  const clusters = useAllDongClusters(filteredByGu);

  // 선택된 동의 클러스터 찾기
  const selectedCluster = selectedDong
    ? clusters.find((c) => c.dongName === selectedDong) ?? null
    : null;

  // 비교 클러스터
  const compareClusters = compareDongs
    .map((d) => clusters.find((c) => c.dongName === d))
    .filter(Boolean) as typeof clusters;

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) setSidebarWidth(e.clientX);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [setSidebarWidth]);

  const width = isSidebarOpen ? sidebarWidth : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <aside
        className="flex-shrink-0 overflow-hidden border-r border-gray-200 transition-[width] duration-300"
        style={{ width }}
      >
        <div className="flex h-full flex-col" style={{ width: sidebarWidth }}>
          {/* 헤더 */}
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-bold text-primary-700">🏠 어디살지?</h1>
              {compareDongs.length > 0 && sidebarView !== "compare" && (
                <button
                  onClick={() => setSidebarView("compare")}
                  className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-200"
                >
                  ⚖️ 비교 ({compareDongs.length}/2)
                </button>
              )}
            </div>
            <PlaceSearch />
          </div>

          {/* 필터 바 (리스트 뷰에서만) */}
          {sidebarView === "list" && <FilterBar />}

          {/* 콘텐츠 영역 */}
          <div className="flex-1 overflow-y-auto">
            {sidebarView === "list" && <HomePage />}
            {sidebarView === "detail" && selectedCluster && (
              <DongDetailPanel
                cluster={selectedCluster}
                allTransactions={allTransactions}
                onClose={() => setSidebarView("list")}
              />
            )}
            {sidebarView === "compare" && (
              <ComparePanel
                clusters={compareClusters}
                onClose={clearCompare}
              />
            )}
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          onMouseDown={handleMouseDown}
          className="w-1 flex-shrink-0 cursor-col-resize bg-gray-200 hover:bg-primary-400 active:bg-primary-500"
        />
      )}

      <button
        onClick={toggleSidebar}
        className="absolute top-4 z-10 flex h-8 w-6 items-center justify-center rounded-r-lg bg-white shadow-md hover:bg-gray-50"
        style={{ left: isSidebarOpen ? width + 4 : 0 }}
      >
        <span className="text-xs text-gray-500">{isSidebarOpen ? "◀" : "▶"}</span>
      </button>

      <main className="relative flex-1">
        <KakaoMap />
        <CurrentLocationButton />
      </main>
    </div>
  );
}
