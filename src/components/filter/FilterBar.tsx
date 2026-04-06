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
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">📐 전용면적 vs 공급면적</p>

                {/* 시각적 비교 */}
                <div className="flex gap-2 mb-2">
                  {/* 전용면적 박스 */}
                  <div className="flex-1 rounded-lg border-2 border-blue-400 bg-blue-50 p-2 text-center">
                    <p className="text-[10px] font-bold text-blue-600">🏠 전용면적</p>
                    <p className="text-[9px] text-blue-500 mt-0.5">내가 실제로 사용하는 공간</p>
                  </div>
                  {/* 공급면적 박스 (전용 포함) */}
                  <div className="flex-1 rounded-lg border-2 border-dashed border-gray-300 bg-white p-2 text-center">
                    <p className="text-[10px] font-bold text-gray-500">📦 공급면적</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">전용 + 복도/계단/엘리베이터</p>
                  </div>
                </div>

                {/* 예시 테이블 */}
                <div className="rounded bg-white p-2 text-[10px]">
                  <p className="font-semibold text-gray-500 mb-1">📋 흔히 말하는 평형 환산표</p>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-gray-500">
                    <span className="font-medium text-gray-600">통칭</span>
                    <span className="font-medium text-gray-600">전용면적</span>
                    <span className="font-medium text-gray-600">공급면적</span>

                    <span>원룸</span><span>16~26㎡</span><span>20~33㎡</span>
                    <span>투룸</span><span>26~40㎡</span><span>33~50㎡</span>
                    <span>쓰리룸</span><span>40~59㎡</span><span>50~74㎡</span>
                    <span>25평형</span><span>59㎡</span><span>84㎡</span>
                    <span>34평형</span><span>84㎡</span><span>114㎡</span>
                  </div>
                </div>

                <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
                  💡 실거래가 데이터는 <strong>전용면적</strong> 기준입니다.
                  부동산 광고에서 "25평" 이라고 하면 보통 공급면적 84㎡(전용 59㎡)를 의미해요.
                </p>
              </div>
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
