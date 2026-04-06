import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import DualRangeFilter from "@/components/filter/DualRangeFilter";

function formatPrice(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rem = manwon % 10000;
    return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만` : `${eok}억`;
  }
  return `${manwon.toLocaleString()}만`;
}

const toPyeong = (sqm: number) => Math.round(sqm / 3.3058 * 10) / 10;

type FilterTab = "dealType" | "price" | "area" | null;

export default function FilterBar() {
  const { filter, setFilter, areaUnit, toggleAreaUnit } = useAppStore();
  const [openTab, setOpenTab] = useState<FilterTab>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenTab(null);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function toggle(tab: FilterTab) {
    setOpenTab(openTab === tab ? null : tab);
  }

  // 버튼 라벨 요약
  const dealLabel = filter.dealType === "전체" ? "거래유형" : filter.dealType;
  const priceLabel = filter.dealType === "월세"
    ? `${filter.monthlyRentRange[0]}~${filter.monthlyRentRange[1]}만`
    : "가격";
  const areaLabel = filter.areaRange[1] < 100
    ? `~${areaUnit === "pyeong" ? toPyeong(filter.areaRange[1]) + "평" : filter.areaRange[1] + "㎡"}`
    : "면적";

  return (
    <div ref={barRef} className="relative">
      {/* 필터 버튼 바 */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-gray-100 bg-white">
        <FilterChip
          label={dealLabel}
          active={openTab === "dealType"}
          hasValue={filter.dealType !== "전체"}
          onClick={() => toggle("dealType")}
        />
        <FilterChip
          label={priceLabel}
          active={openTab === "price"}
          hasValue={filter.monthlyRentRange[0] > 0 || filter.monthlyRentRange[1] < 200}
          onClick={() => toggle("price")}
        />
        <FilterChip
          label={areaLabel}
          active={openTab === "area"}
          hasValue={filter.areaRange[0] > 0 || filter.areaRange[1] < 100}
          onClick={() => toggle("area")}
        />
      </div>

      {/* 팝오버 패널 */}
      {openTab && (
        <div className="absolute left-0 right-0 top-full z-30 border-b border-gray-200 bg-white p-4 shadow-lg">
          {openTab === "dealType" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-500">거래유형</p>
              <div className="flex gap-2">
                {(["전체", "전세", "월세"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter({ dealType: type })}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                      filter.dealType === type
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {openTab === "price" && (
            <div className="flex flex-col gap-4">
              {(filter.dealType === "월세" || filter.dealType === "전체") && (
                <>
                  <DualRangeFilter
                    label="월세 (만원)"
                    min={0} max={300} step={5}
                    value={filter.monthlyRentRange}
                    onChange={(v) => setFilter({ monthlyRentRange: v })}
                    unit="만"
                  />
                  <DualRangeFilter
                    label="월세 보증금 (만원)"
                    min={0} max={30000} step={100}
                    value={filter.wolseDepositRange}
                    onChange={(v) => setFilter({ wolseDepositRange: v })}
                    unit="만"
                  />
                </>
              )}
              {(filter.dealType === "전세" || filter.dealType === "전체") && (
                <DualRangeFilter
                  label="전세 보증금"
                  min={0} max={100000} step={500}
                  value={filter.jeonseDepositRange}
                  onChange={(v) => setFilter({ jeonseDepositRange: v })}
                  formatValue={(n) => formatPrice(n)}
                />
              )}
            </div>
          )}

          {openTab === "area" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-gray-500">전용면적</p>
                <button
                  onClick={toggleAreaUnit}
                  className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                  </svg>
                  {areaUnit === "sqm" ? "㎡" : "평"}
                </button>
              </div>
              <DualRangeFilter
                label=""
                min={0} max={areaUnit === "pyeong" ? 50 : 165} step={areaUnit === "pyeong" ? 1 : 5}
                value={
                  areaUnit === "pyeong"
                    ? [toPyeong(filter.areaRange[0]), toPyeong(filter.areaRange[1])]
                    : filter.areaRange
                }
                onChange={(v) => {
                  if (areaUnit === "pyeong") {
                    setFilter({ areaRange: [Math.round(v[0] * 3.3058), Math.round(v[1] * 3.3058)] });
                  } else {
                    setFilter({ areaRange: v });
                  }
                }}
                unit={areaUnit === "pyeong" ? "평" : "㎡"}
              />
              <p className="text-xs text-gray-400">
                ⓘ 전용면적 = 실제 사용 공간. 공급면적보다 20~30% 작아요.
              </p>
            </div>
          )}

          {/* 조건 초기화 */}
          <button
            onClick={() => {
              setFilter({
                dealType: "전체",
                monthlyRentRange: [0, 200],
                wolseDepositRange: [0, 50000],
                jeonseDepositRange: [0, 50000],
                areaRange: [0, 100],
              });
              setOpenTab(null);
            }}
            className="mt-3 w-full rounded-lg border border-gray-200 py-2 text-xs text-gray-500 hover:bg-gray-50"
          >
            조건 초기화
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label, active, hasValue, onClick,
}: {
  label: string; active: boolean; hasValue: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary-500 bg-primary-50 text-primary-700"
          : hasValue
          ? "border-primary-300 bg-white text-primary-600"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
      <span className="ml-1 text-[10px]">{active ? "▲" : "▼"}</span>
    </button>
  );
}
