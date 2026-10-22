import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useAllDongClusters, type DongCluster } from "@/hooks/useAllDongClusters";
import { useMultiGuTransactions } from "@/hooks/useRealTransactions";
import { getVisibleGus } from "@/utils/getVisibleGus";
import DongOverlay from "./DongOverlay";
import { createRoot, type Root } from "react-dom/client";

export default function KakaoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const {
    map: mapState,
    setMapCenter,
    setMapLevel,
    setVisibleGus,
    visibleGus,
    filter,
    selectedDong,
    setSelectedDong,
    setSidebarView,
    compareDongs,
    toggleCompareDong,
  } = useAppStore();

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

  const clusters = useAllDongClusters(filteredByGu);

  // 지도 초기화
  useEffect(() => {
    if (!containerRef.current || !window.kakao?.maps) return;
    const kakaoMaps = window.kakao.maps;

    const map = new kakaoMaps.Map(containerRef.current, {
      center: new kakaoMaps.LatLng(mapState.center.lat, mapState.center.lng),
      level: mapState.level,
    });

    mapRef.current = map;

    // 이벤트 리스너
    kakaoMaps.event.addListener(map, "center_changed", () => {
      const center = map.getCenter();
      setMapCenter({ lat: center.getLat(), lng: center.getLng() });
    });

    kakaoMaps.event.addListener(map, "zoom_changed", () => {
      setMapLevel(map.getLevel());
    });

    kakaoMaps.event.addListener(map, "idle", () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const visible = getVisibleGus({
        sw: { lat: sw.getLat(), lng: sw.getLng() },
        ne: { lat: ne.getLat(), lng: ne.getLng() },
      });
      setVisibleGus(visible);
    });

    // 초기 visible gus 설정
    setTimeout(() => {
      const bounds = map.getBounds();
      if (bounds) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const visible = getVisibleGus({
          sw: { lat: sw.getLat(), lng: sw.getLng() },
          ne: { lat: ne.getLat(), lng: ne.getLng() },
        });
        setVisibleGus(visible);
      }
    }, 500);

    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 지도 중심/레벨 동기화 (외부에서 변경 시)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;
    const kakaoMaps = window.kakao.maps;

    const currentCenter = map.getCenter();
    const lat = currentCenter.getLat();
    const lng = currentCenter.getLng();

    if (Math.abs(lat - mapState.center.lat) > 0.0001 || Math.abs(lng - mapState.center.lng) > 0.0001) {
      map.setCenter(new kakaoMaps.LatLng(mapState.center.lat, mapState.center.lng));
    }
    if (map.getLevel() !== mapState.level) {
      map.setLevel(mapState.level);
    }
  }, [mapState.center.lat, mapState.center.lng, mapState.level]);

  // 오버레이 렌더링
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;
    const kakaoMaps = window.kakao.maps;

    // 기존 오버레이 제거
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    clusters.forEach((cluster) => {
      const container = document.createElement("div");
      const root = createRoot(container);
      root.render(
        <DongOverlay
          cluster={cluster}
          isSelected={selectedDong === cluster.dongName}
          isComparing={compareDongs.includes(cluster.dongName)}
          onClick={() => {
            setSelectedDong(cluster.dongName);
            setSidebarView("detail");
          }}
          onCompareAdd={() => toggleCompareDong(cluster.dongName)}
          onHover={() => {}}
          onLeave={() => {}}
        />
      );

      const overlay = new kakaoMaps.CustomOverlay({
        position: new kakaoMaps.LatLng(cluster.lat, cluster.lng),
        content: container,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: selectedDong === cluster.dongName ? 10 : 1,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  }, [clusters, selectedDong, compareDongs, setSelectedDong, setSidebarView, toggleCompareDong]);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
