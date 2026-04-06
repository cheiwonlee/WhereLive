// 실거래가 데이터
export interface RealTransaction {
  id: string;
  dongCode: string;
  dongName: string;
  apartName: string;
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  area: number;
  floor: number;
  dealAmount: number;
  depositAmount?: number;
  monthlyRent?: number;
  dealType: "매매" | "전세" | "월세";
  jibun?: string;
  lat?: number;
  lng?: number;
}

// 동네 정보
export interface Neighborhood {
  code: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  avgMonthlyRent?: number;
  avgDeposit?: number;
  score?: CostEfficiencyScore;
}

// 가성비 점수
export interface CostEfficiencyScore {
  total: number;
  rentScore: number;
  facilityScore: number;
  transportScore: number;
}

// 편의시설
export interface Facility {
  name: string;
  category: FacilityCategory;
  lat: number;
  lng: number;
  distance?: number;
}

export type FacilityCategory =
  | "편의점" | "마트" | "병원" | "약국" | "카페" | "은행";

// 필터 상태
export interface FilterState {
  region: string;
  dealType: "매매" | "전세" | "월세" | "전체";
  // 월세 필터
  monthlyRentRange: [number, number];    // 월세 (만원)
  wolseDepositRange: [number, number];   // 월세 보증금 (만원)
  // 전세 필터
  jeonseDepositRange: [number, number];  // 전세 보증금 (만원)
  // 공통
  areaRange: [number, number];           // 전용면적 (㎡)
  yearRange: [number, number];
}

// 지도 상태
export interface MapState {
  center: { lat: number; lng: number };
  level: number;
}

// 가격 추이 차트 데이터
export interface PriceTrend {
  yearMonth: string;
  avgPrice: number;
  count: number;
}
