import type { RealTransaction } from "@/types";

const API_KEY = import.meta.env.VITE_DATA_GO_KR_KEY ?? "";

// 개발: Vite 프록시, 프로덕션: Vercel 서버리스 프록시
const isDev = import.meta.env.DEV;

function buildApiUrl(apiPath: string, params: Record<string, string>): string {
  if (isDev) {
    // Vite 프록시 경유
    const url = new URL(`/api/molit${apiPath}`, window.location.origin);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  } else {
    // Vercel 서버리스 프록시 경유
    const url = new URL("/api/proxy", window.location.origin);
    url.searchParams.set("path", apiPath.slice(1)); // 앞 "/" 제거
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  }
}

const API_PATHS = {
  아파트: "/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
  오피스텔: "/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
  연립다세대: "/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
} as const;

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

const parseAmount = (val?: string) =>
  Number((val ?? "0").replace(/,/g, "").trim()) || 0;

function toTransaction(item: Record<string, string>, buildingType: string): RealTransaction {
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
    dealAmount: deposit,
    depositAmount: deposit,
    monthlyRent,
    dealType: monthlyRent > 0 ? "월세" : "전세",
    jibun: item.jibun ?? "",
  };
}

export async function fetchRealTransactions(params: {
  regionCode: string;
  dealYearMonth: string;
  buildingType?: "아파트" | "오피스텔" | "연립다세대";
}): Promise<RealTransaction[]> {
  const { regionCode, dealYearMonth, buildingType = "오피스텔" } = params;
  if (!API_KEY) return [];

  const apiPath = API_PATHS[buildingType];
  const url = buildApiUrl(apiPath, {
    serviceKey: API_KEY,
    LAWD_CD: regionCode,
    DEAL_YMD: dealYearMonth,
    numOfRows: "1000",
    pageNo: "1",
  });

  try {
    const res = await fetch(url);
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

function getRecentMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export async function fetchAllTransactions(params: {
  regionCode: string;
  dealYearMonth: string;
}): Promise<RealTransaction[]> {
  const types = ["오피스텔", "아파트", "연립다세대"] as const;
  const months = getRecentMonths(3);

  const calls = types.flatMap((buildingType) =>
    months.map((ym) => fetchRealTransactions({ regionCode: params.regionCode, dealYearMonth: ym, buildingType }))
  );

  const results = await Promise.allSettled(calls);
  const allData: RealTransaction[] = [];
  const idSet = new Set<string>();

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      result.value.forEach((item) => {
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
