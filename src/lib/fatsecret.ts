import { Nutrients, EMPTY_NUTRIENTS } from '../types';

/**
 * 음식 검색 클라이언트.
 * 데이터 소스: 식품의약품안전처 식품영양성분DB (Vercel /api/foods-search 프록시 통해 호출)
 */

export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  category?: string; // 식약처 카테고리 (밥류, 면류, 국류, 음료류 등) — 1인분 추정에 사용
  servingDescription: string;
  nutrients: Nutrients;
}

/**
 * 카테고리 기반 1인분 그램수 추정 (한국인 평균 기준)
 * - 영양소는 100g당 값이라서 실제 1인분에 맞춰 servings 배수를 계산해야 함
 */
export function estimateServingGrams(category?: string, name?: string): number {
  const c = category || '';
  const n = name || '';

  // 이름 기반 우선 매칭 (특정 음식)
  if (/라면|컵라면/.test(n)) return 120;
  if (/밥$|공기밥|쌀밥/.test(n)) return 210;
  if (/김밥/.test(n)) return 230;
  if (/국|탕|찌개|전골/.test(n)) return 350;
  if (/우유/.test(n)) return 200;
  if (/사과|배|복숭아/.test(n)) return 200;
  if (/바나나/.test(n)) return 100;

  // 카테고리 기반
  if (/밥류/.test(c)) return 210;
  if (/면류/.test(c)) return 200;
  if (/국|탕|찌개/.test(c)) return 350;
  if (/음료/.test(c)) return 200;
  if (/과자|빵/.test(c)) return 50;
  if (/과일/.test(c)) return 150;
  if (/유제품/.test(c)) return 200;

  return 100; // 기본값
}

const MOCK: FoodSearchResult[] = [
  {
    id: 'mock-1', name: '백미밥', brand: '밥류', category: '밥류',
    servingDescription: '100g',
    nutrients: { ...EMPTY_NUTRIENTS, calories: 143, carbs: 31, protein: 2.5, fat: 0.3, saturated: 0.1, unsaturated: 0.2, sodium: 2, fiber: 0.3 },
  },
  {
    id: 'mock-2', name: '김치찌개', brand: '국·탕·찌개류', category: '국·탕·찌개류',
    servingDescription: '100g',
    nutrients: { ...EMPTY_NUTRIENTS, calories: 61, carbs: 3, protein: 4.5, fat: 3.5, saturated: 1.1, unsaturated: 2.4, cholesterol: 9, sodium: 320, fiber: 0.8, sugar: 1 },
  },
  {
    id: 'mock-3', name: '신라면', brand: '농심', category: '면류',
    servingDescription: '100g',
    nutrients: { ...EMPTY_NUTRIENTS, calories: 417, carbs: 66, protein: 9, fat: 13, saturated: 6.7, unsaturated: 6.3, sodium: 1492, fiber: 3, sugar: 4 },
  },
  {
    id: 'mock-4', name: '삼겹살', brand: '육류', category: '육류',
    servingDescription: '100g',
    nutrients: { ...EMPTY_NUTRIENTS, calories: 331, protein: 17, fat: 28, saturated: 10.2, unsaturated: 17.7, trans: 0.1, cholesterol: 72, sodium: 56 },
  },
];

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const endpoint =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? '/api/foods-search'
      : undefined;

  if (!endpoint) {
    await new Promise((r) => setTimeout(r, 200));
    if (!query.trim()) return MOCK;
    return MOCK.filter((f) => f.name.includes(query));
  }

  const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('음식 검색 API 호출 실패');
  return res.json();
}
