import { useState } from "react";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { useAppStore } from "@/stores/useAppStore";
import { useRealTransactions } from "@/hooks/useRealTransactions";
import { useDongClusters, type DongCluster } from "@/hooks/useDongClusters";
import { SEOUL_GU_CODES } from "@/constants/guCodes";

export default function KakaoMap() {
  const { map, setMapCenter, setMapLevel, searchGu, searchYearMonth, filter } =
    useAppStore();
  const [selectedDong, setSelectedDong] = useState<DongCluster | null>(null);

  const regionCode = searchGu ? SEOUL_GU_CODES[searchGu] ?? "" : "";
  const { data } = useRealTransactions(regionCode, searchYearMonth);

  // 필터 적용
  const filtered = (data ?? []).filter((item) => {
    if (filter.dealType !== "전체" && item.dealType !== filter.dealType)
      return false;
    if (filter.dealType === "월세") {
      const rent = item.monthlyRent || 0;
      if (rent < filter.priceRange[0] || rent > filter.priceRange[1])
        return false;
    }
    if (item.area < filter.areaRange[0] || item.area > filter.areaRange[1])
      return false;
    return true;
  });

  const { clusters } = useDongClusters(filtered, searchGu);

  return (
    <Map
      center={map.center}
      level={map.level}
      className="h-full w-full"
      onClick={() => setSelectedDong(null)}
      onCenterChanged={(m) => {
        const latlng = m.getCenter();
        setMapCenter({ lat: latlng.getLat(), lng: latlng.getLng() });
      }}
      onZoomChanged={(m) => setMapLevel(m.getLevel())}
    >
      {clusters.map((cluster) => (
        <MapMarker
          key={cluster.dongName}
          position={{ lat: cluster.lat, lng: cluster.lng }}
          onClick={() => setSelectedDong(cluster)}
        />
      ))}

      {/* 선택된 동 인포윈도우 */}
      {selectedDong && (
        <CustomOverlayMap
          position={{ lat: selectedDong.lat, lng: selectedDong.lng }}
          yAnchor={1.3}
        >
          <DongInfoCard
            cluster={selectedDong}
            onClose={() => setSelectedDong(null)}
          />
        </CustomOverlayMap>
      )}
    </Map>
  );
}

/** 동별 요약 카드 (인포윈도우) */
function DongInfoCard({
  cluster,
  onClose,
}: {
  cluster: DongCluster;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        padding: "14px 16px",
        minWidth: "200px",
        maxWidth: "260px",
        position: "relative",
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      {/* 닫기 */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          color: "#9ca3af",
        }}
      >
        ✕
      </button>

      {/* 동 이름 */}
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1f2937" }}>
        {cluster.dongName}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#9ca3af",
          marginTop: "2px",
        }}
      >
        거래 {cluster.count}건
      </div>

      {/* 통계 */}
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          gap: "12px",
        }}
      >
        {cluster.wolseCount > 0 && (
          <div>
            <div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: 600 }}>
              월세 {cluster.wolseCount}건
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1f2937" }}>
              {cluster.avgDeposit.toLocaleString()}/{cluster.avgMonthlyRent.toLocaleString()}
            </div>
            <div style={{ fontSize: "10px", color: "#9ca3af" }}>
              평균 보증금/월세 (만원)
            </div>
          </div>
        )}

        {cluster.jeonseCount > 0 && (
          <div>
            <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: 600 }}>
              전세 {cluster.jeonseCount}건
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
