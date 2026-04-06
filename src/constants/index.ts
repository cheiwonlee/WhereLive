// 카카오맵 앱키 (.env에서 관리)
export const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY ?? "";

// 공공데이터 API 키 (.env에서 관리)
export const DATA_GO_KR_KEY = import.meta.env.VITE_DATA_GO_KR_KEY ?? "";

// 가성비 점수 가중치
export const SCORE_WEIGHTS = {
  rent: 0.4, // 월세 40%
  facility: 0.3, // 편의시설 30%
  transport: 0.3, // 교통 30%
} as const;

// 편의시설 검색 반경 (미터)
export const FACILITY_RADIUS = 1000;

// 교통 검색 반경 (미터)
export const TRANSPORT_RADIUS = 500;

// 지도 기본 설정
export const MAP_DEFAULT = {
  center: { lat: 37.5665, lng: 126.978 }, // 서울 시청
  level: 8,
} as const;

// 서울 구 목록
export const SEOUL_GU_LIST = [
  "강남구", "강동구", "강북구", "강서구", "관악구",
  "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구",
  "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중구", "중랑구",
] as const;
