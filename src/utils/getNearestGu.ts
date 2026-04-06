import { GU_CENTERS } from "@/constants/guCenters";

/**
 * 좌표로부터 가장 가까운 서울시 구를 판별
 * (간이 방식: 구 중심 좌표와의 거리 비교)
 */
export function getNearestGu(lat: number, lng: number): string | null {
  let nearest: string | null = null;
  let minDist = Infinity;

  for (const [gu, center] of Object.entries(GU_CENTERS)) {
    const dist = Math.sqrt(
      Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = gu;
    }
  }

  // 서울 밖이면 null (대략적 서울 경계 체크)
  if (lat < 37.41 || lat > 37.72 || lng < 126.76 || lng > 127.19) {
    return null;
  }

  return nearest;
}
