import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

interface SearchResult {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
}

/**
 * 주소에서 서울시 구 이름을 추출
 * "서울 마포구 합정동 123" → "마포구"
 */
function extractGu(address: string): string | null {
  const match = address.match(/(서울\s*(?:특별시\s*)?)?(\S+구)/);
  return match ? match[2] : null;
}

export default function PlaceSearch() {
  const { setMapCenter, setMapLevel } = useAppStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (!window.kakao?.maps?.services) return;

      const ps = new window.kakao.maps.services.Places();
      // 서울 중심 좌표 기준 검색
      const options = {
        location: new window.kakao.maps.LatLng(37.5665, 126.978),
        size: 8,
      };

      ps.keywordSearch(
        value,
        (data: any[], status: string) => {
          if (status === window.kakao.maps.services.Status.OK) {
            setResults(data.slice(0, 6));
            setIsOpen(true);
          } else {
            setResults([]);
          }
        },
        options
      );
    }, 300);
  }

  function handleSelect(item: SearchResult) {
    const lat = Number(item.y);
    const lng = Number(item.x);

    setQuery(item.place_name);
    setIsOpen(false);

    // 지도 이동 → 뷰포트 감지가 자동으로 구 판별
    setMapCenter({ lat, lng });
    setMapLevel(4);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="동, 역, 건물명으로 검색 (예: 합정동, 강남역)"
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {results.map((item, idx) => {
            const gu = extractGu(item.address_name);
            return (
              <li
                key={idx}
                onClick={() => handleSelect(item)}
                className="cursor-pointer px-3 py-2.5 transition-colors hover:bg-primary-50 border-b border-gray-50 last:border-b-0"
              >
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.place_name}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 truncate">
                  {item.address_name}
                  {gu && (
                    <span className="ml-1.5 text-primary-500">· 데이터 조회 가능</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
