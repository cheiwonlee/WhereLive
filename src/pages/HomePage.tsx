import { useAppStore } from "@/stores/useAppStore";
import { useMultiGuTransactions } from "@/hooks/useRealTransactions";
import { getShortName } from "@/constants/regionCodes";
import type { RealTransaction } from "@/types";

const toPyeong = (sqm: number) => Math.round(sqm / 3.3058 * 10) / 10;

function formatPrice(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rem = manwon % 10000;
    return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만` : `${eok}억`;
  }
  return `${manwon.toLocaleString()}만`;
}

export default function HomePage() {
  const { filter, visibleGus, selectedDong, setSelectedDong, areaUnit, focusLocation } = useAppStore();
  const { guData, isLoading } = useMultiGuTransactions(visibleGus);

  const filtered: (RealTransaction & { guName: string })[] = [];
  for (const { gu, transactions } of guData) {
    for (const item of transactions) {
      if (selectedDong && item.dongName !== selectedDong) continue;
      if (filter.dealType !== "전체" && item.dealType !== filter.dealType) continue;
      if (item.dealType === "월세") {
        const rent = item.monthlyRent || 0;
        const dep = item.depositAmount || 0;
        if (rent < filter.monthlyRentRange[0] || rent > filter.monthlyRentRange[1]) continue;
        if (dep < filter.wolseDepositRange[0] || dep > filter.wolseDepositRange[1]) continue;
      }
      if (item.dealType === "전세") {
        const dep = item.depositAmount || 0;
        if (dep < filter.jeonseDepositRange[0] || dep > filter.jeonseDepositRange[1]) continue;
      }
      if (item.area < filter.areaRange[0] || item.area > filter.areaRange[1]) continue;
      filtered.push({ ...item, guName: gu });
    }
  }

  const areaDisplay = (sqm: number) =>
    areaUnit === "pyeong" ? `${toPyeong(sqm)}평` : `${sqm}㎡`;

  // 상단에 표시할 지역명 (짧은 형태)
  const regionLabel = visibleGus.length > 0
    ? visibleGus.slice(0, 3).map(getShortName).join(" · ") + (visibleGus.length > 3 ? " ..." : "")
    : "매물 목록";

  return (
    <div className="flex flex-col">
      {selectedDong && (
        <div className="flex items-center justify-between bg-primary-50 px-4 py-2">
          <span className="text-sm font-semibold text-primary-700">📍 {selectedDong}</span>
          <button onClick={() => setSelectedDong(null)} className="text-xs text-primary-500 hover:text-primary-700">
            전체 보기
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <span className="text-sm font-semibold text-gray-700">{regionLabel}</span>
        <div className="flex items-center gap-2">
          {isLoading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />}
          {!isLoading && filtered.length > 0 && <span className="text-xs text-gray-400">{filtered.length}건</span>}
        </div>
      </div>

      {visibleGus.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-3xl">🗺️</p>
          <p className="mt-3 text-sm text-gray-500">지도를 움직여보세요</p>
          <p className="mt-1 text-xs text-gray-300">줌인하면 실거래가가 자동으로 표시됩니다</p>
        </div>
      )}

      {visibleGus.length > 0 && !isLoading && filtered.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-gray-400">해당 조건의 거래 데이터가 없습니다</div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col">
          {filtered.slice(0, 80).map((item) => (
            <TransactionCard key={item.id} item={item} areaLabel={areaDisplay} onFocus={focusLocation} guName={item.guName} />
          ))}
          {filtered.length > 80 && <p className="py-3 text-center text-xs text-gray-400">외 {filtered.length - 80}건 더...</p>}
        </div>
      )}
    </div>
  );
}

function TransactionCard({ item, areaLabel, onFocus, guName }: {
  item: RealTransaction; areaLabel: (n: number) => string;
  onFocus: (lat: number, lng: number) => void; guName: string;
}) {
  const isWolse = item.dealType === "월세";
  const shortGu = getShortName(guName);

  async function handleClick() {
    const { geocodeAddress } = await import("@/utils/geocode");
    const parts = guName.split(" ");
    const city = parts[0].endsWith("시") || parts[0].endsWith("군") ? parts[0] : parts[0] + "시";
    const gu = parts.length > 1 ? parts.slice(1).join(" ") : "";
    const addr = gu ? `${city} ${gu} ${item.dongName}` : `${city} ${item.dongName}`;
    const coord = await geocodeAddress(addr);
    if (coord) onFocus(coord.lat, coord.lng);
  }

  return (
    <div onClick={handleClick} className="cursor-pointer border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isWolse ? (
            <p className="text-sm font-bold text-gray-900">월세 {formatPrice(item.depositAmount ?? 0)}/{item.monthlyRent?.toLocaleString()}</p>
          ) : (
            <p className="text-sm font-bold text-gray-900">전세 {formatPrice(item.dealAmount)}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{areaLabel(item.area)} · {item.floor}층</p>
          <p className="mt-0.5 text-xs text-gray-400">{shortGu} {item.dongName} · {item.apartName}</p>
        </div>
        <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
          isWolse ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
        }`}>{item.dealType}</span>
      </div>
    </div>
  );
}
