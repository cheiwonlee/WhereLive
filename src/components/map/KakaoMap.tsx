import { useMemo, useRef, useCallback, useState } from "react";
import { Map, CustomOverlayMap, Circle } from "react-kakao-maps-sdk";
import { useAppStore } from "@/stores/useAppStore";
import { useMultiGuTransactions } from "@/hooks/useRealTransactions";
import { useAllDongClusters } from "@/hooks/useAllDongClusters";
import { getVisibleGus } from "@/utils/getVisibleGus";
import { getShortName } from "@/constants/regionCodes";
import { toast } from "@/stores/useToastStore";
import DongOverlay from "@/components/map/DongOverlay";
import MapPOIOverlay from "@/components/map/MapPOIOverlay";

export default function KakaoMap() {
  const {
    map, setMapCenter, setMapLevel,
    visibleGus, setVisibleGus,
    filter, selectedDong, setSelectedDong,
    compareDongs, toggleCompareDong,
  } = useAppStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleGusRef = useRef<string[]>(visibleGus);
  visibleGusRef.current = visibleGus;

  // 뷰포트 bounds 저장 (클러스터 필터링용)
  const [viewBounds, setViewBounds] = useState<{
    sw: { lat: number; lng: number }; ne: { lat: number; lng: number };
  } | null>(null);

  // 호버 중인 동 (경계 원 표시용)
  const [hoveredDong, setHoveredDong] = useState<string | null>(null);

  const { guData, isLoading } = useMultiGuTransactions(visibleGus);

  const filteredByGu = useMemo(() => {
    return guData.map(({ gu, transactions }) => ({
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
  }, [guData, filter]);

  const allFiltered = useMemo(() => filteredByGu.flatMap((g) => g.items), [filteredByGu]);
  const allClusters = useAllDongClusters(filteredByGu);

  // 뷰포트 안에 있는 클러스터만 표시
  const visibleClusters = useMemo(() => {
    if (!viewBounds) return allClusters;
    const BUFFER = 0.005;
    return allClusters.filter((c) =>
      c.lat >= viewBounds.sw.lat - BUFFER &&
      c.lat <= viewBounds.ne.lat + BUFFER &&
      c.lng >= viewBounds.sw.lng - BUFFER &&
      c.lng <= viewBounds.ne.lng + BUFFER
    );
  }, [allClusters, viewBounds]);

  const detectVisibleGus = useCallback((mapObj: kakao.maps.Map) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const bounds = mapObj.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const boundsObj = {
        sw: { lat: sw.getLat(), lng: sw.getLng() },
        ne: { lat: ne.getLat(), lng: ne.getLng() },
      };
      setViewBounds(boundsObj);

      if (mapObj.getLevel() <= 8) {
        const gus = getVisibleGus(boundsObj);
        const newSorted = [...gus].sort().join(",");
        const curSorted = [...visibleGusRef.current].sort().join(",");
        if (newSorted !== curSorted) setVisibleGus(gus);
      } else if (visibleGusRef.current.length > 0) {
        setVisibleGus([]);
      }
    }, 400);
  }, [setVisibleGus]);

  const regionNames = visibleGus.map(getShortName);

  // 호버 중인 클러스터 (경계 원 표시)
  const hoveredCluster = hoveredDong
    ? visibleClusters.find((c) => c.dongName === hoveredDong)
    : null;

  return (
    <Map
      center={map.center} level={map.level} className="h-full w-full"
      onClick={() => setSelectedDong(null)}
      onCreate={(mapObj: kakao.maps.Map) => detectVisibleGus(mapObj)}
      onCenterChanged={(mapObj: kakao.maps.Map) => {
        const c = mapObj.getCenter();
        setMapCenter({ lat: c.getLat(), lng: c.getLng() });
        detectVisibleGus(mapObj);
      }}
      onZoomChanged={(mapObj: kakao.maps.Map) => {
        setMapLevel(mapObj.getLevel());
        detectVisibleGus(mapObj);
      }}
    >
      {/* 호버 시 동 경계 원 */}
      {hoveredCluster && (
        <Circle
          center={{ lat: hoveredCluster.lat, lng: hoveredCluster.lng }}
          radius={500}
          strokeWeight={2}
          strokeColor="#6366f1"
          strokeOpacity={0.6}
          strokeStyle="solid"
          fillColor="#6366f1"
          fillOpacity={0.08}
        />
      )}

      {/* 동별 배지 */}
      {visibleClusters.map((cluster) => (
        <CustomOverlayMap
          key={cluster.fullAddress}
          position={{ lat: cluster.lat, lng: cluster.lng }}
          yAnchor={0.5} xAnchor={0.5}
        >
          <DongOverlay
            cluster={cluster}
            isSelected={selectedDong === cluster.dongName}
            isComparing={compareDongs.includes(cluster.dongName)}
            onClick={() => setSelectedDong(
              selectedDong === cluster.dongName ? null : cluster.dongName
            )}
            onCompareAdd={() => {
              const wasIncluded = compareDongs.includes(cluster.dongName);
              if (!wasIncluded && compareDongs.length >= 2) {
                toast.error("최대 2개까지만 비교할 수 있어요");
                return;
              }
              if (selectedDong === cluster.dongName) setSelectedDong(null);
              toggleCompareDong(cluster.dongName);
              if (wasIncluded) {
                toast.info(`${cluster.dongName} 비교에서 제거됨`);
              } else {
                const newCount = compareDongs.length + 1;
                toast.success(`${cluster.dongName} 비교 추가 (${newCount}/2)`);
              }
            }}
            onHover={() => setHoveredDong(cluster.dongName)}
            onLeave={() => setHoveredDong(null)}
          />
        </CustomOverlayMap>
      ))}

      {/* 지하철역 + 대학교 */}
      <MapPOIOverlay />

      {/* 상단 배지 */}
      <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
        <div className="rounded-full bg-white/90 px-4 py-1.5 shadow-md backdrop-blur-sm">
          {isLoading ? (
            <span className="text-xs text-gray-400">조회 중...</span>
          ) : regionNames.length > 0 ? (
            <>
              <span className="text-xs font-medium text-gray-600">
                {regionNames.slice(0, 4).join(" · ")}
                {regionNames.length > 4 && ` 외 ${regionNames.length - 4}개`}
              </span>
              <span className="ml-1.5 text-xs text-gray-400">{allFiltered.length}건</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">줌인하면 실거래가가 표시됩니다</span>
          )}
        </div>
      </div>
    </Map>
  );
}
