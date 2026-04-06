/**
 * 카카오 로컬 API를 활용한 주변 시설 검색
 * 카테고리 코드: https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-category
 */

export interface NearbyPlace {
  name: string;
  category: string;
  distance: number; // 미터
  lat: number;
  lng: number;
  address: string;
  phone?: string;
}

// 카카오 카테고리 코드
const CATEGORY_CODES = {
  // 편의시설
  편의점: "CS2",
  대형마트: "MT1",
  카페: "CE7",
  은행: "BK9",
  병원: "HP8",
  약국: "PM9",
  // 교통
  지하철역: "SW8",
  // 안전
  경찰서: "PO3",
  // 교육
  학교: "SC4",
  // 공공
  관공서: "PB1",
} as const;

type CategoryKey = keyof typeof CATEGORY_CODES;

/**
 * 카카오 로컬 API - 카테고리로 장소 검색
 */
function searchByCategory(
  lat: number,
  lng: number,
  categoryCode: string,
  radius: number = 1000
): Promise<NearbyPlace[]> {
  return new Promise((resolve) => {
    if (!window.kakao?.maps?.services) {
      resolve([]);
      return;
    }

    const ps = new window.kakao.maps.services.Places();
    const options: any = {
      location: new window.kakao.maps.LatLng(lat, lng),
      radius,
      sort: "distance",
    };

    ps.categorySearch(
      categoryCode as any,
      (data: any[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve(
            data.map((item) => ({
              name: item.place_name,
              category: item.category_group_name,
              distance: Number(item.distance),
              lat: Number(item.y),
              lng: Number(item.x),
              address: item.address_name,
              phone: item.phone || undefined,
            }))
          );
        } else {
          resolve([]);
        }
      },
      options
    );
  });
}

export interface NearbyAnalysis {
  facilities: {
    convenience: NearbyPlace[]; // 편의점
    mart: NearbyPlace[];        // 마트
    cafe: NearbyPlace[];        // 카페
    bank: NearbyPlace[];        // 은행
    hospital: NearbyPlace[];    // 병원
    pharmacy: NearbyPlace[];    // 약국
  };
  transport: {
    subway: NearbyPlace[];      // 지하철역
  };
  safety: {
    police: NearbyPlace[];      // 경찰서
  };
  education: {
    school: NearbyPlace[];      // 학교
  };
  scores: {
    facilityScore: number;
    transportScore: number;
    safetyScore: number;
    quietScore: number;
  };
}

/**
 * 특정 좌표 주변의 시설을 종합 분석
 */
export async function analyzeNearby(
  lat: number,
  lng: number
): Promise<NearbyAnalysis> {
  // 병렬로 모든 카테고리 검색
  const [convenience, mart, cafe, bank, hospital, pharmacy, subway, police, school] =
    await Promise.all([
      searchByCategory(lat, lng, CATEGORY_CODES.편의점, 500),
      searchByCategory(lat, lng, CATEGORY_CODES.대형마트, 1000),
      searchByCategory(lat, lng, CATEGORY_CODES.카페, 500),
      searchByCategory(lat, lng, CATEGORY_CODES.은행, 1000),
      searchByCategory(lat, lng, CATEGORY_CODES.병원, 1000),
      searchByCategory(lat, lng, CATEGORY_CODES.약국, 500),
      searchByCategory(lat, lng, CATEGORY_CODES.지하철역, 1000),
      searchByCategory(lat, lng, CATEGORY_CODES.경찰서, 2000),
      searchByCategory(lat, lng, CATEGORY_CODES.학교, 1000),
    ]);

  // 점수 산출
  const facilityScore = calcFacilityScore(convenience, mart, cafe, bank, hospital, pharmacy);
  const transportScore = calcTransportScore(subway);
  const safetyScore = calcSafetyScore(police);
  const quietScore = calcQuietScore(convenience, cafe);

  return {
    facilities: { convenience, mart, cafe, bank, hospital, pharmacy },
    transport: { subway },
    safety: { police },
    education: { school },
    scores: { facilityScore, transportScore, safetyScore, quietScore },
  };
}

/**
 * 편의시설 점수 (0~100)
 * 반경 500m 편의점 + 카페 + 약국, 반경 1km 마트 + 병원 + 은행
 */
function calcFacilityScore(
  convenience: NearbyPlace[],
  mart: NearbyPlace[],
  cafe: NearbyPlace[],
  bank: NearbyPlace[],
  hospital: NearbyPlace[],
  pharmacy: NearbyPlace[]
): number {
  let score = 0;
  // 편의점: 3개 이상이면 만점 (30점)
  score += Math.min(30, convenience.length * 10);
  // 마트: 1개 이상이면 만점 (15점)
  score += Math.min(15, mart.length * 15);
  // 카페: 5개 이상이면 만점 (15점)
  score += Math.min(15, cafe.length * 3);
  // 은행: 2개 이상이면 만점 (10점)
  score += Math.min(10, bank.length * 5);
  // 병원: 2개 이상이면 만점 (15점)
  score += Math.min(15, hospital.length * 8);
  // 약국: 2개 이상이면 만점 (15점)
  score += Math.min(15, pharmacy.length * 8);

  return Math.min(100, score);
}

/**
 * 교통 점수 (0~100)
 * 반경 1km 지하철역
 */
function calcTransportScore(subway: NearbyPlace[]): number {
  if (subway.length === 0) return 10; // 역 없으면 10점

  const nearest = subway[0].distance;
  // 300m 이내: 100점, 500m: 80점, 1km: 50점
  if (nearest <= 300) return 100;
  if (nearest <= 500) return 80;
  if (nearest <= 700) return 65;
  return 50;
}

/**
 * 치안 점수 (0~100)
 * 반경 2km 경찰서/치안센터
 */
function calcSafetyScore(police: NearbyPlace[]): number {
  if (police.length === 0) return 30;
  const nearest = police[0].distance;
  if (nearest <= 500) return 100;
  if (nearest <= 1000) return 80;
  return 60;
}

/**
 * 조용한 환경 점수 (0~100)
 * 편의점/카페가 적을수록 높은 점수 (역 상관)
 */
function calcQuietScore(
  convenience: NearbyPlace[],
  cafe: NearbyPlace[]
): number {
  const total = convenience.length + cafe.length;
  if (total <= 2) return 90;
  if (total <= 5) return 70;
  if (total <= 10) return 50;
  if (total <= 20) return 30;
  return 15;
}

export { CATEGORY_CODES, type CategoryKey };
