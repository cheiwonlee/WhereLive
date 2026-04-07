import { usePreferenceStore } from "@/stores/usePreferenceStore";

const WEIGHT_LABELS: Record<string, { label: string; icon: string; desc: string; defaultVal: number }> = {
  affordability: { label: "가격 가성비", icon: "💰", desc: "월세·보증금이 저렴한 지역 선호", defaultVal: 80 },
  transport: { label: "대중교통", icon: "🚇", desc: "지하철역·버스 접근성", defaultVal: 70 },
  safety: { label: "치안·안전", icon: "🛡️", desc: "범죄율 낮은 안전한 지역", defaultVal: 60 },
  convenience: { label: "편의시설", icon: "🏪", desc: "편의점, 마트, 병원, 카페 등", defaultVal: 50 },
  quiet: { label: "조용한 환경", icon: "🌿", desc: "주거 밀집도 낮은 조용한 동네", defaultVal: 30 },
};

export default function PreferencePanel() {
  const { prefs, setPrefs, setWeight, isOpen, toggleOpen } = usePreferenceStore();

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
      >
        <span>⚙️ 내 선호 조건 설정</span>
        <span className="text-xs">▼</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={toggleOpen}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-2.5"
      >
        <span className="text-sm font-semibold text-gray-700">⚙️ 내 선호 조건</span>
        <span className="text-xs text-gray-400">▲</span>
      </button>

      <div className="flex flex-col gap-4 p-4">
        {/* 예산 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            월 실수령액 (만원)
          </label>
          <input
            type="number"
            value={prefs.budget || ""}
            onChange={(e) => setPrefs({ budget: Number(e.target.value) })}
            placeholder="예: 250"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {prefs.budget > 0 && (
            <p className="mt-1 text-[10px] text-gray-400">
              적정 주거비(30% 기준): 월 {Math.round(prefs.budget * 0.3).toLocaleString()}만원
            </p>
          )}
        </div>

        {/* 선호 거래유형 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">선호 거래유형</label>
          <div className="flex gap-2">
            {(["상관없음", "전세", "월세"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPrefs({ preferredType: type })}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  prefs.preferredType === type
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 자차 여부 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">🚗 자차 보유</span>
          <button
            onClick={() => setPrefs({ hasOwnCar: !prefs.hasOwnCar })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              prefs.hasOwnCar
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {prefs.hasOwnCar ? "있음" : "없음"}
          </button>
        </div>

        {/* 가중치 슬라이더 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-600">중요도 설정</label>
            <span className="text-[10px] text-gray-400">기본값 = 청년층 평균</span>
          </div>
          <div className="flex flex-col gap-3">
            {Object.entries(WEIGHT_LABELS).map(([key, { label, icon, desc, defaultVal }]) => {
              const cur = prefs.weights[key as keyof typeof prefs.weights];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-gray-600">{icon} {label}</span>
                    <span className="text-[10px] text-gray-400">
                      {cur} <span className="text-gray-300">(기본 {defaultVal})</span>
                    </span>
                  </div>
                  <input type="range" min={0} max={100} step={10}
                    value={cur}
                    onChange={(e) => setWeight(key as keyof typeof prefs.weights, Number(e.target.value))}
                    className="w-full accent-primary-600 h-1.5"
                  />
                  <p className="text-[10px] text-gray-300">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 점수 산출 방식 설명 */}
        <details className="rounded-lg bg-gray-50 p-3 text-[10px] text-gray-500">
          <summary className="cursor-pointer font-semibold text-gray-600">📊 가성비 점수 산출 방식</summary>
          <div className="mt-2 leading-relaxed space-y-1.5">
            <p>각 항목 점수 (0~100) × 내가 설정한 중요도 가중치 → 정규화하여 종합 점수 산출</p>
            <p>• <strong>가격 가성비 (기본 80)</strong>: 입력한 월급의 30%를 적정 주거비로 보고, 평균 월세가 이보다 낮을수록 높은 점수</p>
            <p>• <strong>대중교통 (기본 70)</strong>: 카카오 로컬 API로 1km 내 지하철역 검색 → 가장 가까운 역까지의 거리 기반</p>
            <p>• <strong>치안·안전 (기본 60)</strong>: 2km 내 경찰서 검색 → 가장 가까운 곳까지의 거리 기반</p>
            <p>• <strong>편의시설 (기본 50)</strong>: 편의점/마트/카페/병원/약국/은행 6종 갯수 가중합</p>
            <p>• <strong>조용한 환경 (기본 30)</strong>: 편의점+카페 밀집도가 낮을수록 높은 점수 (역상관)</p>
            <p className="mt-2 text-amber-600">💡 청년층 1인가구 기준으로 가격·교통 우선, 조용함은 우선순위 낮게 설정. 본인 라이프스타일에 맞게 조정하세요.</p>
          </div>
        </details>

        <div className="rounded-lg bg-blue-50 p-3 text-[10px] text-blue-600 leading-relaxed">
          💡 <strong>주거비 30% 규칙</strong>: 국토교통부 권장 기준으로, 월 소득의 30% 이내를 주거비로 사용하는 것이 적정합니다.
        </div>
      </div>
    </div>
  );
}
