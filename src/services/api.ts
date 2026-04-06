import type { RealTransaction } from "@/types";

const API_KEY = import.meta.env.VITE_DATA_GO_KR_KEY ?? "";

const API_PATHS = {
  아파트: "/api/molit/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
  오피스텔: "/api/molit/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
  연립다세대: "/api/molit/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
} as const;

/**
 * DOMParser 기반 XML → 객체 배열 변환
 */
function xmlToItems(xmlText: string): Record<string, string>[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  const resultCode = doc.querySelector("resultCode")?.textContent?.trim() ?? "";
  if (resultCode && resultCode !== "00" && resultCode !== "000") {
    const resultMsg = doc.querySelector("resultMsg")?.textContent?.trim() ?? "";
    console.error(`[어디살지] API 에러: ${resultCode} - ${resultMsg}`);
    return [];
  }

  const items = doc.querySelectorAll("item");
  const result: Record<string, string>[] = [];

  items.forEach((item) => {
    const obj: Record<string, string> = {};
    for (const child of Array.from(item.children)) {
      const val = (child.textContent ?? "").trim();
      if (val) obj[child.tagName] = val;
    }
    result.push(obj);
  });

  return result;
}

/** 금액 파싱 (콤마/공백 제거) */
const parseAmount = (val?: string) =>
  Number((val ?? "0").replace(/,/g, "").trim()) || 0;

/**
 * 파싱된 item → RealTransaction
 * 실제 API 태그명: dealYear, dealMonth, dealDay, deposit, monthlyRent,
 * excluUseAr, floor, umdNm, aptNm, offiNm, mhouseNm, sggCd
 */
function toTransaction(
  item: Record<string, string>,
  buildingType: string
): RealTransaction {
  const deposit = parseAmount(item.deposit);
  const monthlyRent = parseAmount(item.monthlyRent);
  const name = item.aptNm ?? item.offiNm ?? item.mhouseNm ?? "";
  const dongName = item.umdNm ?? "";
  const year = Number(item.dealYear) || 0;
  const month = Number(item.dealMonth) || 0;
  const day = Number(item.dealDay) || 0;
  const area = Number(item.excluUseAr) || 0;
  const floor = Number(item.floor) || 0;

  return {
    id: `${buildingType}-${year}${month}${day}-${name || dongName}-${floor}-${Math.random().toString(36).slice(2, 6)}`,
    dongCode: item.sggCd ?? "",
    dongName,
    apartName: name || dongName,
    dealYear: year,
    dealMonth: month,
    dealDay: day,
    area,
    floor,
    dealAmount: deposit, // 전월세에서는 보증금이 거래금액
    depositAmount: deposit,
    monthlyRent,
    dealType: monthlyRent > 0 ? "월세" : "전세",
    jibun: item.jibun ?? "",
  };
}

/**
 * 실거래가 데이터 조회
 */
export async function fetchRealTransactions(params: {
  regionCode: string;
  dealYearMonth: string;
  buildingType?: "아파트" | "오피스텔" | "연립다세대";
}): Promise<RealTransaction[]> {
  const { regionCode, dealYearMonth, buildingType = "오피스텔" } = params;

  if (!API_KEY) {
    console.error("[어디살지] VITE_DATA_GO_KR_KEY가 .env에 없습니다");
    return [];
  }

  const apiPath = API_PATHS[buildingType];
  const url = new URL(apiPath, window.location.origin);
  url.searchParams.set("serviceKey", API_KEY);
  url.searchParams.set("LAWD_CD", regionCode);
  url.searchParams.set("DEAL_YMD", dealYearMonth);
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");

  console.log(`[어디살지] ${buildingType} 실거래가 조회:`, regionCode, dealYearMonth);

  try {
    const res = await fetch(url.toString());
    const text = await res.text();
    const items = xmlToItems(text);
    const parsed = items.map((item) => toTransaction(item, buildingType));

    const wolse = parsed.filter((p) => p.dealType === "월세").length;
    const jeonse = parsed.filter((p) => p.dealType === "전세").length;
    console.log(`[어디살지] ${buildingType} ${parsed.length}건 (월세 ${wolse} / 전세 ${jeonse})`);

    return parsed;
  } catch (error) {
    console.error("[어디살지] API 호출 실패:", error);
    return [];
  }
}

/**
 * 최근 N개월 YYYYMM 배열 생성
 */
function getRecentMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

/**
 * 여러 건물 유형 × 최근 3개월 실거래가를 한 번에 조회
 */
export async function fetchAllTransactions(params: {
  regionCode: string;
  dealYearMonth: string; // 기준월 (캐시 키용, 실제로는 3개월 조회)
}): Promise<RealTransaction[]> {
  const types = ["오피스텔", "아파트", "연립다세대"] as const;
  const months = getRecentMonths(3);

  // 3개 타입 × 3개월 = 최대 9개 API 호출 (병렬)
  const calls = types.flatMap((buildingType) =>
    months.map((ym) => fetchRealTransactions({ regionCode: params.regionCode, dealYearMonth: ym, buildingType }))
  );

  const results = await Promise.allSettled(calls);
  const allData: RealTransaction[] = [];
  const idSet = new Set<string>();

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      result.value.forEach((item) => {
        // 중복 제거 (동일 건물+날짜+층)
        const key = `${item.apartName}-${item.dealYear}${item.dealMonth}${item.dealDay}-${item.floor}-${item.area}`;
        if (!idSet.has(key)) {
          idSet.add(key);
          allData.push(item);
        }
      });
    }
  });

  console.log(`[어디살지] 전체 ${allData.length}건 (3개월, 중복제거)`);
  return allData;
}
