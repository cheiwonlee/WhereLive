import { useEffect, useState, useRef } from "react";
import { CustomOverlayMap } from "react-kakao-maps-sdk";
import { useAppStore } from "@/stores/useAppStore";

interface POI {
  name: string;
  lat: number;
  lng: number;
  type: "subway" | "university";
}

/**
 * 뷰포트 내 지하철역 + 대학교를 카카오 API로 검색해서 지도에 표시
 */
export default function MapPOIOverlay() {
  const { map } = useAppStore();
  const [pois, setPois] = useState<POI[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKey = useRef("");

  useEffect(() => {
    if (!window.kakao?.maps?.services) return;
    if (map.level > 6) { setPois([]); return; } // 줌 아웃이면 숨김

    // 디바운스
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const key = `${map.center.lat.toFixed(3)}-${map.center.lng.toFixed(3)}-${map.level}`;
      if (key === lastKey.current) return;
      lastKey.current = key;

      const ps = new window.kakao.maps.services.Places();
      const loc = new window.kakao.maps.LatLng(map.center.lat, map.center.lng);
      const radius = map.level <= 3 ? 1000 : map.level <= 5 ? 2000 : 3000;

      const results: POI[] = [];

      // 지하철역
      ps.categorySearch(
        "SW8" as any,
        (data: any[], status: string) => {
          if (status === window.kakao.maps.services.Status.OK) {
            data.forEach((d) => {
              results.push({
                name: d.place_name.replace(/역$/, ""),
                lat: Number(d.y),
                lng: Number(d.x),
                type: "subway",
              });
            });
          }

          // 대학교
          ps.categorySearch(
            "SC4" as any,
            (data2: any[], status2: string) => {
              if (status2 === window.kakao.maps.services.Status.OK) {
                data2
                  .filter((d) => d.category_name?.includes("대학교"))
                  .forEach((d) => {
                    results.push({
                      name: d.place_name,
                      lat: Number(d.y),
                      lng: Number(d.x),
                      type: "university",
                    });
                  });
              }
              setPois([...results]);
            },
            { location: loc, radius, sort: "distance" } as any
          );
        },
        { location: loc, radius, sort: "distance" } as any
      );
    }, 600);
  }, [map.center.lat, map.center.lng, map.level]);

  if (map.level > 6) return null;

  return (
    <>
      {pois.map((poi, i) => (
        <CustomOverlayMap
          key={`poi-${i}-${poi.name}`}
          position={{ lat: poi.lat, lng: poi.lng }}
          yAnchor={1.2}
          xAnchor={0.5}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              background: poi.type === "subway" ? "#22c55e" : "#8b5cf6",
              color: "white",
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "10px",
              whiteSpace: "nowrap",
              fontFamily: "Pretendard, sans-serif",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              opacity: 0.9,
            }}
          >
            <span>{poi.type === "subway" ? "🚇" : "🎓"}</span>
            <span>{poi.name}</span>
          </div>
        </CustomOverlayMap>
      ))}
    </>
  );
}
