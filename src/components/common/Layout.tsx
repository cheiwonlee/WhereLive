import { useCallback, useRef, useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useMultiGuTransactions } from "@/hooks/useRealTransactions";
import { useAllDongClusters } from "@/hooks/useAllDongClusters";
import KakaoMap from "@/components/map/KakaoMap";
import MapControls from "@/components/map/MapControls";
import FilterBar from "@/components/filter/FilterBar";
import PlaceSearch from "@/components/filter/PlaceSearch";
import PreferencePanel from "@/components/filter/PreferencePanel";
import HomePage from "@/pages/HomePage";
import DongDetailPanel from "@/components/common/DongDetailPanel";
import ComparePanel from "@/components/common/ComparePanel";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Layout() {
  const {
    isSidebarOpen, sidebarWidth, toggleSidebar, setSidebarWidth,
    sidebarView, setSidebarView,
    selectedDong, visibleGus, filter, compareDongs, clearCompare,
  } = useAppStore();
  const isDragging = useRef(false);
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // 사이드바 콘텐츠 변경 시 스크롤 맨 위로
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (mobileScrollRef.current) mobileScrollRef.current.scrollTop = 0;
  }, [sidebarView, selectedDong, visibleGus.join(",")]);

  const [sheetHeight, setSheetHeight] = useState<"collapsed" | "half" | "full">("collapsed");

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

  const selectedCluster = selectedDong
    ? clusters.find((c) => c.dongName === selectedDong) ?? null
    : null;

  const compareClusters = compareDongs
    .map((d) => clusters.find((c) => c.dongName === d))
    .filter(Boolean) as typeof clusters;

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const move = (e: MouseEvent) => { if (isDragging.current) setSidebarWidth(e.clientX); };
    const up = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [setSidebarWidth]);

  const sidebarContent = (
    <>
      {sidebarView === "list" && (
        <>
          <div className="px-4 py-3"><PreferencePanel /></div>
          <HomePage />
        </>
      )}
      {sidebarView === "detail" && selectedCluster && (
        <DongDetailPanel cluster={selectedCluster} allTransactions={allTransactions} onClose={() => setSidebarView("list")} />
      )}
      {sidebarView === "compare" && (
        <ComparePanel clusters={compareClusters} onClose={clearCompare} />
      )}
    </>
  );

  if (isMobile) {
    const sheetClass = sheetHeight === "full" ? "h-[85vh]" : sheetHeight === "half" ? "h-[45vh]" : "h-[120px]";
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <div className="absolute inset-0">
          <KakaoMap />
          <MapControls />
        </div>
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="bg-white/95 backdrop-blur-sm px-3 pt-[env(safe-area-inset-top)] pb-1 shadow-sm">
            <div className="py-2"><PlaceSearch /></div>
            <FilterBar />
          </div>
        </div>
        {compareDongs.length > 0 && sidebarView !== "compare" && (
          <button onClick={() => { setSidebarView("compare"); setSheetHeight("full"); }}
            className="absolute top-[140px] right-3 z-20 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            ⚖️ 비교 ({compareDongs.length}/2)
          </button>
        )}
        <div className={`absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 ${sheetClass}`}>
          <div className="flex justify-center py-2 cursor-pointer"
            onClick={() => {
              if (sheetHeight === "collapsed") setSheetHeight("half");
              else if (sheetHeight === "half") setSheetHeight("full");
              else setSheetHeight("collapsed");
            }}>
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>
          <div ref={mobileScrollRef} className="overflow-y-auto" style={{ height: "calc(100% - 24px)" }}>
            {sidebarContent}
          </div>
        </div>
      </div>
    );
  }

  const width = isSidebarOpen ? sidebarWidth : 0;
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <aside className="flex-shrink-0 overflow-hidden border-r border-gray-200 transition-[width] duration-300" style={{ width }}>
        <div className="flex h-full flex-col" style={{ width: sidebarWidth }}>
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-bold text-primary-700">🏠 어디살지?</h1>
              {compareDongs.length > 0 && sidebarView !== "compare" && (
                <button onClick={() => setSidebarView("compare")}
                  className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-200">
                  ⚖️ 비교 ({compareDongs.length}/2)
                </button>
              )}
            </div>
            <PlaceSearch />
          </div>
          {sidebarView === "list" && <FilterBar />}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">{sidebarContent}</div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div onMouseDown={handleMouseDown}
          className="w-1 flex-shrink-0 cursor-col-resize bg-gray-200 hover:bg-primary-400 active:bg-primary-500" />
      )}
      <button onClick={toggleSidebar}
        className="absolute top-4 z-10 flex h-8 w-6 items-center justify-center rounded-r-lg bg-white shadow-md hover:bg-gray-50"
        style={{ left: isSidebarOpen ? width + 4 : 0 }}>
        <span className="text-xs text-gray-500">{isSidebarOpen ? "◀" : "▶"}</span>
      </button>
      <main className="relative flex-1">
        <KakaoMap />
        <MapControls />
      </main>
    </div>
  );
}
