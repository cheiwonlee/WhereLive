/**
 * 동 좌표 변환 — 정적 테이블(서울) + 카카오 API(전국)
 */
import { DONG_COORDS } from "@/constants/dongCoords";

const cache = new Map<string, { lat: number; lng: number }>();
const failedCache = new Set<string>();

/**
 * 주소 → 좌표 변환
 * 1. 정적 테이블 (서울, 즉시)
 * 2. 카카오 키워드 검색 (전국, 유연)
 * 3. 카카오 주소 검색 (fallback)
 * 4. "OO가" 제거 후 재시도
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (cache.has(address)) return cache.get(address)!;
  if (failedCache.has(address)) return null;

  // 정적 테이블 조회 (서울 동)
  // "서울시 마포구 합정동" → key "마포구-합정동"
  const match = address.match(/(\S+구)\s+(\S+)$/);
  if (match) {
    const key = `${match[1]}-${match[2]}`;
    if (DONG_COORDS[key]) {
      cache.set(address, DONG_COORDS[key]);
      return DONG_COORDS[key];
    }
  }

  if (!window.kakao?.maps?.services) {
    failedCache.add(address);
    return null;
  }

  // 카카오 키워드 검색 (가장 유연, 전국 커버)
  let coord = await keywordSearch(address);

  // 주소 검색 fallback
  if (!coord) {
    coord = await addressSearch(address);
  }

  // "동1가" → "동" 단순화 후 재시도
  if (!coord) {
    const simplified = address.replace(/\d+가$/, "").trim();
    if (simplified !== address) {
      coord = await keywordSearch(simplified);
    }
  }

  if (coord) {
    cache.set(address, coord);
    return coord;
  }

  failedCache.add(address);
  return null;
}

function keywordSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(query, (data: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        resolve({ lat: Number(data[0].y), lng: Number(data[0].x) });
      } else {
        resolve(null);
      }
    });
  });
}

function addressSearch(address: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
      } else {
        resolve(null);
      }
    });
  });
}
