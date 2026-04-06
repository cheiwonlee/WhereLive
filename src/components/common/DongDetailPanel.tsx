import type { DongCluster } from "@/hooks/useAllDongClusters";
import type { RealTransaction } from "@/types";
import PriceTrendChart from "@/components/chart/PriceTrendChart";
import ScoreCard from "@/components/score/ScoreCard";
import { useAppStore } from "@/stores/useAppStore";
import { getDisplayType, getTypeStyle, formatPrice, toPyeong } from "@/utils/display";

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
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">{cluster.dongName}</h2>
          <p className="text-xs text-gray-400">{cluster.shortGuName} · 거래 {cluster.count}건</p>
        </div>
        <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100">← 목록</button>
      </div>

      <div className="border-b border-gray-50 px-4 py-4">
        <ScoreCard cluster={cluster} allTransactions={allTransactions} />
      </div>

      <div className="border-b border-gray-50 px-4 py-4">
        <PriceTrendChart transactions={cluster.transactions} dongName={cluster.dongName} />
      </div>

      <div className="px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">거래 내역 ({cluster.count}건)</h3>
      </div>
      <div className="flex flex-col">
        {cluster.transactions.slice(0, 30).map((item) => {
          const displayType = getDisplayType(item);
          const style = getTypeStyle(displayType);
          return (
            <div key={item.id} onClick={() => focusLocation(cluster.lat, cluster.lng)}
              className="cursor-pointer border-b border-gray-50 px-4 py-2.5 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  {displayType === "전세" ? (
                    <p className="text-sm font-bold text-gray-900">전세 {formatPrice(item.dealAmount)}</p>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      {displayType} {formatPrice(item.depositAmount ?? 0)}/{item.monthlyRent?.toLocaleString()}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">{item.apartName} · {areaDisplay(item.area)} · {item.floor}층</p>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>{displayType}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
