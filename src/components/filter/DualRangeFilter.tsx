interface Props {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (val: [number, number]) => void;
  unit?: string;
  formatValue?: (n: number) => string;
}

/**
 * 최소/최대 숫자 입력 + 레인지 슬라이더 결합 필터
 */
export default function DualRangeFilter({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit = "",
  formatValue,
}: Props) {
  const display = formatValue ?? ((n: number) => `${n.toLocaleString()}${unit}`);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">
          {display(value[0])} ~ {display(value[1])}
        </span>
      </div>

      {/* 숫자 입력 (콤마 자동) */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={value[0].toLocaleString()}
          onChange={(e) => {
            const v = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
            if (v <= value[1] && v >= min) onChange([v, value[1]]);
          }}
          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-center text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <span className="text-xs text-gray-400 flex-shrink-0">~</span>
        <input
          type="text"
          inputMode="numeric"
          value={value[1].toLocaleString()}
          onChange={(e) => {
            const v = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
            if (v >= value[0] && v <= max) onChange([value[0], v]);
          }}
          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-center text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* 듀얼 슬라이더 */}
      <div className="relative h-6">
        {/* 최소값 슬라이더 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= value[1]) onChange([v, value[1]]);
          }}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-md"
        />
        {/* 최대값 슬라이더 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= value[0]) onChange([value[0], v]);
          }}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow-md"
        />
        {/* 트랙 배경 */}
        <div className="pointer-events-none absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-gray-200">
          <div
            className="absolute h-full rounded-full bg-primary-400"
            style={{
              left: `${((value[0] - min) / (max - min)) * 100}%`,
              right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
