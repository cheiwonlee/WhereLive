/**
 * 카카오맵 외부 링크 열기
 * 검색어 또는 좌표 기반
 */
export function openKakaoMap(query: string, lat?: number, lng?: number) {
  if (lat && lng) {
    // 좌표 기반 (가장 정확)
    const url = `https://map.kakao.com/link/map/${encodeURIComponent(query)},${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    // 검색어 기반
    const url = `https://map.kakao.com/?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
