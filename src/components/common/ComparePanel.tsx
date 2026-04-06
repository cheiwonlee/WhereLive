import type { DongCluster } from "@/hooks/useAllDongClusters";
import { calculateScore } from "@/utils/scoreCalc";

interface Props {
  clusters: DongCluster[];
  onClose: () => void;
}

function formatPrice(manwon: number): string {
  if (manwon >= 10000) {
    return `${(manwon / 10000).toFixed(1)}억`;
  }
  return `${manwon.toLocaleString()}만`;
}

export default function ComparePanel({ clusters, onClose }: Props) {
  if (clusters.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-3xl">⚖️</p>
        <p className="mt-3 text-sm text-gray-500">
          비교할 동네를 2개 선택해주세요
        </p>
        <p className="mt-1 text-xs text-gray-300">
          지도에서 동 배지를 길게 눌러 비교에 추가
        </p>
      </div>
    );
  }

  const scores = clusters.map((c) => calculateScore(c.transactions));

  const rows: { label: string; values: string[]; better?: number }[] = [
    {
      label: "종합 점수",
      values: scores.map((s) => `${s.total}점`),
      better: scores[0].total >= scores[1].total ? 0 : 1,
    },
    {
      label: "월세 가성비",
      values: scores.map((s) => `${s.rentScore}점`),
      better: scores[0].rentScore >= scores[1].rentScore ? 0 : 1,
    },
    {
      label: "평균 월세",
      values: scores.map((s) => `${s.avgMonthlyRent.toLocaleString()}만`),
      better: scores[0].avgMonthlyRent <= scores[1].avgMonthlyRent ? 0 : 1,
    },
    {
      label: "평균 보증금",
      values: scores.map((s) => formatPrice(s.avgDeposit)),
      better: scores[0].avgDeposit <= scores[1].avgDeposit ? 0 : 1,
    },
    {
      label: "거래 건수",
      values: clusters.map((c) => `${c.count}건`),
      better: clusters[0].count >= clusters[1].count ? 0 : 1,
    },
    {
      label: "월세 비중",
      values: clusters.map((c) =>
        c.count > 0
          ? `${Math.round((c.wolseCount / c.count) * 100)}%`
          : "-"
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-800">⚖️ 동네 비교</h2>
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
        >
          ← 닫기
        </button>
      </div>

      {/* 동네 이름 헤더 */}
      <div className="grid grid-cols-3 border-b border-gray-100 px-4 py-3">
        <div />
        {clusters.map((c, i) => (
          <div key={i} className="text-center">
            <p className="text-sm font-bold text-gray-800">{c.dongName}</p>
            <p className="text-[10px] text-gray-400">{c.shortGuName}</p>
          </div>
        ))}
      </div>

      {/* 비교 행 */}
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-3 border-b border-gray-50 px-4 py-3 items-center"
        >
          <span className="text-xs text-gray-500">{row.label}</span>
          {row.values.map((val, i) => (
            <span
              key={i}
              className={`text-center text-sm font-semibold ${
                row.better === i
                  ? "text-primary-600"
                  : "text-gray-700"
              }`}
            >
              {val}
              {row.better === i && (
                <span className="ml-1 text-[10px] text-primary-400">👑</span>
              )}
            </span>
          ))}
        </div>
      ))}

      {/* 점수 바 시각 비교 */}
      <div className="px-4 py-4">
        <h3 className="mb-3 text-xs font-semibold text-gray-500">종합 점수 비교</h3>
        {clusters.map((c, i) => (
          <div key={i} className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">{c.dongName}</span>
              <span className="text-xs font-bold" style={{
                color: scores[i].total >= 70 ? "#22c55e" : scores[i].total >= 40 ? "#f59e0b" : "#ef4444"
              }}>
                {scores[i].total}점
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${scores[i].total}%`,
                  backgroundColor: i === 0 ? "#3b82f6" : "#f59e0b",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
