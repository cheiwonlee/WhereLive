import type { RealTransaction } from "@/types";

/**
 * 한국부동산원/통계청 기준:
 * - 보증금이 월세의 240배(20년치) 초과 → 반전세
 * - 그 외 월세 > 0 → 월세
 * - 월세 = 0 → 전세
 */
export function getDisplayType(item: RealTransaction): "전세" | "월세" | "반전세" {
  if (item.dealType === "전세") return "전세";
  const deposit = item.depositAmount ?? 0;
  const rent = item.monthlyRent ?? 0;
  if (rent > 0 && deposit > rent * 240) return "반전세";
  return "월세";
}

/**
 * 표시 유형에 따른 스타일
 */
export function getTypeStyle(displayType: "전세" | "월세" | "반전세"): {
  bg: string;
  text: string;
} {
  switch (displayType) {
    case "전세":
      return { bg: "bg-green-50", text: "text-green-600" };
    case "반전세":
      return { bg: "bg-purple-50", text: "text-purple-600" };
    case "월세":
      return { bg: "bg-blue-50", text: "text-blue-600" };
  }
}

/**
 * 금액 포맷
 */
export function formatPrice(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rem = manwon % 10000;
    return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만` : `${eok}억`;
  }
  return `${manwon.toLocaleString()}만`;
}

export const toPyeong = (sqm: number) => Math.round(sqm / 3.3058 * 10) / 10;
