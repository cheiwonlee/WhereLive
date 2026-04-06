import { useEffect, useState, useRef } from "react";
import { geocodeAddress } from "@/utils/geocode";
import type { RealTransaction } from "@/types";

export interface DongCluster {
  dongName: string;
  guName: string;      // "서울 마포구" 형태
  shortGuName: string;  // "마포구" 형태
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
 * 지역명에서 지오코딩용 주소 생성
 * "서울 마포구" + "합정동" → "서울시 마포구 합정동"
 * "부산 해운대구" + "좌동" → "부산시 해운대구 좌동"
 */
function buildAddress(region: string, dong: string): string {
  const parts = region.split(" ");
  const city = parts[0];
  const gu = parts.length > 1 ? parts.slice(1).join(" ") : "";

  const cityFull = city.endsWith("시") || city.endsWith("군") || city.endsWith("도")
    ? city
    : city + "시";

  return gu ? `${cityFull} ${gu} ${dong}` : `${cityFull} ${dong}`;
}

export function useAllDongClusters(
  guData: { gu: string; items: RealTransaction[] }[]
) {
  const [clusters, setClusters] = useState<DongCluster[]>([]);
  const cancelRef = useRef(false);
  const sigRef = useRef("");

  useEffect(() => {
    const sig = guData.map((g) => `${g.gu}:${g.items.length}`).join("|");
    if (sig === sigRef.current) return;
    sigRef.current = sig;
    cancelRef.current = false;

    if (guData.every((g) => g.items.length === 0)) {
      setClusters([]);
      return;
    }

    async function build() {
      const result: DongCluster[] = [];

      for (const { gu, items } of guData) {
        if (cancelRef.current) return;
        if (!items.length) continue;

        const parts = gu.split(" ");
        const shortGuName = parts.length > 1 ? parts[parts.length - 1] : gu;

        // 동별 그룹
        const grouped = new Map<string, RealTransaction[]>();
        for (const t of items) {
          const dong = t.dongName?.trim();
          if (!dong) continue;
          if (!grouped.has(dong)) grouped.set(dong, []);
          grouped.get(dong)!.push(t);
        }

        for (const [dongName, txs] of grouped) {
          if (cancelRef.current) return;

          const fullAddress = buildAddress(gu, dongName);
          const coord = await geocodeAddress(fullAddress);
          if (!coord) continue;

          const wolseItems = txs.filter((t) => t.dealType === "월세");

          const avgDeposit = wolseItems.length > 0
            ? Math.round(wolseItems.reduce((s, t) => s + (t.depositAmount ?? 0), 0) / wolseItems.length)
            : 0;
          const avgMonthlyRent = wolseItems.length > 0
            ? Math.round(wolseItems.reduce((s, t) => s + (t.monthlyRent ?? 0), 0) / wolseItems.length)
            : 0;

          result.push({
            dongName,
            guName: gu,
            shortGuName,
            fullAddress,
            lat: coord.lat,
            lng: coord.lng,
            count: txs.length,
            avgDeposit,
            avgMonthlyRent,
            wolseCount: wolseItems.length,
            jeonseCount: txs.filter((t) => t.dealType === "전세").length,
            transactions: txs,
          });
        }
      }

      if (!cancelRef.current) setClusters(result);
    }

    build();
    return () => { cancelRef.current = true; };
  }, [guData]);

  return clusters;
}
