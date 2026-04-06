import { useQueries } from "@tanstack/react-query";
import { fetchAllTransactions } from "@/services/api";
import { REGION_CODES, getShortName } from "@/constants/regionCodes";
import type { RealTransaction } from "@/types";

/**
 * 여러 지역의 실거래가를 동시에 조회 (전국)
 * visibleRegions: ["서울 마포구", "서울 서대문구", "부산 해운대구", ...] 형태
 */
export function useMultiGuTransactions(visibleRegions: string[]) {
  const now = new Date();
  const dealYearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const queries = useQueries({
    queries: visibleRegions.map((region) => {
      const regionCode = REGION_CODES[region] ?? "";
      return {
        queryKey: ["realTransactions", regionCode],
        queryFn: () => fetchAllTransactions({ regionCode, dealYearMonth }),
        enabled: !!regionCode,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
      };
    }),
  });

  const allData: { gu: string; shortName: string; transactions: RealTransaction[] }[] = [];
  let isLoading = false;

  queries.forEach((q, idx) => {
    if (q.isLoading) isLoading = true;
    if (q.data) {
      allData.push({
        gu: visibleRegions[idx],
        shortName: getShortName(visibleRegions[idx]),
        transactions: q.data,
      });
    }
  });

  return { guData: allData, isLoading };
}
