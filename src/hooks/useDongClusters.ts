import { useEffect, useState } from "react";
import { geocodeAddress } from "@/utils/geocode";
import type { RealTransaction } from "@/types";

export interface DongCluster {
  dongName: string;
  fullAddress: string;
  lat: number;
  lng: number;
  count: number;
  avgDeposit: number;
  avgMonthlyRent: number;
  wolseCount: number;
  jeonseCount: number;
  transactions: RealTransaction[];
}

/**
 * 실거래가 데이터를 동별로 클러스터링 + 좌표 부여
 */
export function useDongClusters(
  transactions: RealTransaction[],
  guName: string
) {
  const [clusters, setClusters] = useState<DongCluster[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transactions.length || !guName) {
      setClusters([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function buildClusters() {
      // 동별 그룹핑 (동 이름 없는 건 제외)
      const grouped = new Map<string, RealTransaction[]>();
      for (const t of transactions) {
        const dong = t.dongName?.trim();
        if (!dong) continue;
        if (!grouped.has(dong)) grouped.set(dong, []);
        grouped.get(dong)!.push(t);
      }

      const result: DongCluster[] = [];

      for (const [dongName, items] of grouped) {
        if (cancelled) return;

        // 서울시 + 구 + 동 형태로 지오코딩
        const fullAddress = `서울시 ${guName} ${dongName}`;
        const coord = await geocodeAddress(fullAddress);

        if (!coord) continue;

        const wolseItems = items.filter((i) => i.dealType === "월세");
        const jeonseItems = items.filter((i) => i.dealType === "전세");

        const avgDeposit =
          wolseItems.length > 0
            ? Math.round(
                wolseItems.reduce((s, i) => s + (i.depositAmount ?? 0), 0) /
                  wolseItems.length
              )
            : 0;

        const avgMonthlyRent =
          wolseItems.length > 0
            ? Math.round(
                wolseItems.reduce((s, i) => s + (i.monthlyRent ?? 0), 0) /
                  wolseItems.length
              )
            : 0;

        result.push({
          dongName,
          fullAddress,
          lat: coord.lat,
          lng: coord.lng,
          count: items.length,
          avgDeposit,
          avgMonthlyRent,
          wolseCount: wolseItems.length,
          jeonseCount: jeonseItems.length,
          transactions: items,
        });
      }

      if (!cancelled) {
        setClusters(result);
        setLoading(false);
      }
    }

    buildClusters();

    return () => {
      cancelled = true;
    };
  }, [transactions, guName]);

  return { clusters, loading };
}
