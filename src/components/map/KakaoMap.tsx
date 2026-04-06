import { useMemo, useRef, useCallback } from "react";
import { Map, CustomOverlayMap } from "react-kakao-maps-sdk";
import { useAppStore } from "@/stores/useAppStore";
import { useMultiGuTransactions } from "@/hooks/useRealTransactions";
import { useAllDongClusters } from "@/hooks/useAllDongClusters";
import { getVisibleGus } from "@/utils/getVisibleGus";
import { getShortName } from "@/constants/regionCodes";
import DongOverlay from "@/components/map/DongOverlay";

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
  const clusters = useAllDongClusters(filteredByGu);

  const detectVisibleGus = useCallback((mapObj: kakao.maps.Map) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const bounds = mapObj.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      if (mapObj.getLevel() <= 8) {
        const gus = getVisibleGus({
          sw: { lat: sw.getLat(), lng: sw.getLng() },
          ne: { lat: ne.getLat(), lng: ne.getLng() },
        });
        const newSorted = [...gus].sort().join(",");
        const curSorted = [...visibleGusRef.current].sort().join(",");
        if (newSorted !== curSorted) setVisibleGus(gus);
      } else if (visibleGusRef.current.length > 0) {
        setVisibleGus([]);
      }
    }, 400);
  }, [setVisibleGus]);

  const regionNames = visibleGus.map(getShortName);

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
      {clusters.map((cluster) => (
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
            onCompareAdd={() => toggleCompareDong(cluster.dongName)}
          />
        </CustomOverlayMap>
      ))}

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
