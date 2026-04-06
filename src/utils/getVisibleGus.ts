import { REGION_CENTERS } from "@/constants/regionCenters";

/**
 * 지도 뷰포트 안에 있는 시/군/구를 찾기 (전국)
 * 0.02도(약 2km) 버퍼 적용
 */
export function getVisibleGus(bounds: {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}): string[] {
  const BUFFER = 0.02;
  const result: string[] = [];

  for (const [region, center] of Object.entries(REGION_CENTERS)) {
    if (
      center.lat >= bounds.sw.lat - BUFFER &&
      center.lat <= bounds.ne.lat + BUFFER &&
      center.lng >= bounds.sw.lng - BUFFER &&
      center.lng <= bounds.ne.lng + BUFFER
    ) {
      result.push(region);
    }
  }

  return result;
}
