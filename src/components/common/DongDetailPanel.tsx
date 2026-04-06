import type { DongCluster } from "@/hooks/useAllDongClusters";
import type { RealTransaction } from "@/types";
import PriceTrendChart from "@/components/chart/PriceTrendChart";
import ScoreCard from "@/components/score/ScoreCard";
import { useAppStore } from "@/stores/useAppStore";

const toPyeong = (sqm: number) => Math.round(sqm / 3.3058 * 10) / 10;

function formatPrice(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rem = manwon % 10000;
    return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만` : `${eok}억`;
  }
  return `${manwon.toLocaleString()}만`;
}

interface Props {
  cluster: DongCluster;
  allTransactions: RealTransaction[];
  onClose: () => void;
}

export default function DongDetailPanel({ cluster, allTransactions, onClose }: Props) {
  const { areaUnit, focusLocation } = useAppStore();

  const areaDisplay = (sqm: number) =>
    areaUnit === "pyeong" ? `${toPyeong(sqm)}평` : `${sqm}㎡`;

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">{cluster.dongName}</h2>
          <p className="text-xs text-gray-400">{cluster.shortGuName} · 거래 {cluster.count}건</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
        >
          ← 목록
        </button>
      </div>

      {/* 가성비 점수 */}
      <div className="border-b border-gray-50 px-4 py-4">
        <ScoreCard cluster={cluster} allTransactions={allTransactions} />
      </div>

      {/* 가격 추이 차트 */}
      <div className="border-b border-gray-50 px-4 py-4">
        <PriceTrendChart
          transactions={cluster.transactions}
          dongName={cluster.dongName}
        />
      </div>

      {/* 거래 내역 */}
      <div className="px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          거래 내역 ({cluster.count}건)
        </h3>
      </div>
      <div className="flex flex-col">
        {cluster.transactions.slice(0, 30).map((item) => {
          const isWolse = item.dealType === "월세";
          return (
            <div
              key={item.id}
              onClick={() => focusLocation(cluster.lat, cluster.lng)}
              className="cursor-pointer border-b border-gray-50 px-4 py-2.5 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  {isWolse ? (
                    <p className="text-sm font-bold text-gray-900">
                      월세 {formatPrice(item.depositAmount ?? 0)}/{item.monthlyRent?.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      전세 {formatPrice(item.dealAmount)}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">
                    {item.apartName} · {areaDisplay(item.area)} · {item.floor}층
                  </p>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  isWolse ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                }`}>
                  {item.dealType}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
