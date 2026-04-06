import type { RealTransaction } from "@/types";
import type { DongCluster } from "@/hooks/useAllDongClusters";
import { usePreferenceStore } from "@/stores/usePreferenceStore";

export interface ScoreResult {
  total: number;
  rentScore: number;
  facilityScore: number;
  transportScore: number;
  safetyScore: number;
  quietScore: number;
  avgMonthlyRent: number;
  avgDeposit: number;
  medianRent: number;
  affordabilityRatio: number; // 소득 대비 주거비 비율
}

/**
 * 가성비 점수 산정 (사용자 선호도 반영)
 *
 * 참고 연구:
 * - 국토교통부 주거실태조사: 청년층(19~34세) 주거비 부담 기준 RIR 30%
 * - 한국부동산원: 주거선호도 조사 — 대중교통 > 가격 > 편의시설 > 치안 순
 * - KB부동산: 2030세대 전월세 선호 요인 분석
 */
export function calculateScore(
  transactions: RealTransaction[],
  budget: number = 0,
): ScoreResult {
  const wolse = transactions.filter((t) => t.dealType === "월세");
  const deposits = transactions.map((t) => t.depositAmount ?? 0).filter((d) => d > 0);

  const avgMonthlyRent = wolse.length > 0
    ? Math.round(wolse.reduce((s, t) => s + (t.monthlyRent ?? 0), 0) / wolse.length)
    : 0;

  const avgDeposit = deposits.length > 0
    ? Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length)
    : 0;

  const sortedRents = wolse.map((t) => t.monthlyRent ?? 0).sort((a, b) => a - b);
  const medianRent = sortedRents.length > 0 ? sortedRents[Math.floor(sortedRents.length / 2)] : 0;

  // 소득 대비 주거비 비율 (RIR)
  const affordabilityRatio = budget > 0 && avgMonthlyRent > 0
    ? Math.round((avgMonthlyRent / budget) * 100)
    : 0;

  // 월세 가성비 점수: 예산 대비 또는 서울 평균 대비
  const BASELINE = budget > 0 ? budget * 0.3 : 70; // 예산의 30% 또는 서울 평균 70만원
  const rentScore = avgMonthlyRent > 0
    ? Math.min(100, Math.max(0, Math.round((1 - avgMonthlyRent / (BASELINE * 2)) * 100)))
    : 50;

  // 추후 카카오 로컬 API 연동 시 실제 데이터로 교체
  const txCount = transactions.length;
  const facilityScore = Math.min(100, Math.max(20, Math.round(30 + txCount * 1.2)));
  const transportScore = Math.min(100, Math.max(20, Math.round(25 + txCount * 1.0)));
  const safetyScore = Math.min(100, Math.max(30, Math.round(40 + txCount * 0.8)));
  const quietScore = Math.min(100, Math.max(10, Math.round(80 - txCount * 0.5)));

  const total = Math.round(
    rentScore * 0.4 + facilityScore * 0.15 + transportScore * 0.2 +
    safetyScore * 0.15 + quietScore * 0.1
  );

  return {
    total, rentScore, facilityScore, transportScore, safetyScore, quietScore,
    avgMonthlyRent, avgDeposit, medianRent, affordabilityRatio,
  };
}

/** 사용자 가중치를 반영한 종합 점수 */
export function calculateWeightedScore(
  base: ScoreResult,
  weights: Record<string, number>
): number {
  const w = {
    affordability: weights.affordability ?? 80,
    transport: weights.transport ?? 70,
    safety: weights.safety ?? 60,
    convenience: weights.convenience ?? 50,
    quiet: weights.quiet ?? 30,
  };
  const total = w.affordability + w.transport + w.safety + w.convenience + w.quiet;
  if (total === 0) return base.total;

  return Math.round(
    (base.rentScore * w.affordability +
     base.transportScore * w.transport +
     base.safetyScore * w.safety +
     base.facilityScore * w.convenience +
     base.quietScore * w.quiet) / total
  );
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "최고";
  if (score >= 70) return "좋음";
  if (score >= 50) return "보통";
  if (score >= 30) return "낮음";
  return "매우 낮음";
}

interface Props {
  cluster: DongCluster;
  allTransactions: RealTransaction[];
}

export default function ScoreCard({ cluster }: Props) {
  const { prefs } = usePreferenceStore();
  const base = calculateScore(cluster.transactions, prefs.budget);
  const weightedTotal = calculateWeightedScore(base, prefs.weights);

  const bars = [
    { label: "가격 가성비", score: base.rentScore, icon: "💰" },
    { label: "대중교통", score: base.transportScore, icon: "🚇", hint: "추정" },
    { label: "치안·안전", score: base.safetyScore, icon: "🛡️", hint: "추정" },
    { label: "편의시설", score: base.facilityScore, icon: "🏪", hint: "추정" },
    { label: "조용한 환경", score: base.quietScore, icon: "🌿", hint: "추정" },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        🏆 {cluster.dongName} 가성비 분석
      </h3>

      {/* 총점 */}
      <div className="mb-4 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-white text-xl font-bold"
          style={{ backgroundColor: getScoreColor(weightedTotal) }}
        >
          {weightedTotal}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-800">{getScoreLabel(weightedTotal)}</p>
          <p className="text-xs text-gray-400">
            {prefs.budget > 0
              ? `월 ${prefs.budget.toLocaleString()}만 기준`
              : "내 선호 조건 반영"}
          </p>
        </div>
      </div>

      {/* 예산 대비 분석 */}
      {prefs.budget > 0 && base.avgMonthlyRent > 0 && (
        <div className={`mb-4 rounded-lg p-3 text-xs ${
          base.affordabilityRatio <= 30
            ? "bg-green-50 text-green-700"
            : base.affordabilityRatio <= 50
            ? "bg-amber-50 text-amber-700"
            : "bg-red-50 text-red-700"
        }`}>
          {base.affordabilityRatio <= 30
            ? `✅ 적정 수준! 소득의 ${base.affordabilityRatio}%를 주거비로 사용`
            : base.affordabilityRatio <= 50
            ? `⚠️ 다소 부담. 소득의 ${base.affordabilityRatio}%를 주거비로 사용 (권장 30% 이하)`
            : `🚨 과도한 부담. 소득의 ${base.affordabilityRatio}%를 주거비로 사용`}
        </div>
      )}

      {/* 세부 점수 */}
      <div className="flex flex-col gap-2.5">
        {bars.map(({ label, score, icon, hint }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-gray-600">{icon} {label}
                {hint && <span className="ml-1 text-[10px] text-gray-300">*{hint}</span>}
              </span>
              <span className="text-xs font-semibold" style={{ color: getScoreColor(score) }}>
                {score}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 통계 */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBox label="평균 월세" value={`${base.avgMonthlyRent.toLocaleString()}만`} />
        <StatBox label="중앙값" value={`${base.medianRent.toLocaleString()}만`} />
        <StatBox label="평균 보증금" value={fmtDeposit(base.avgDeposit)} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2 text-center">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-xs font-bold text-gray-700">{value}</p>
    </div>
  );
}

function fmtDeposit(manwon: number): string {
  return manwon >= 10000 ? `${(manwon / 10000).toFixed(1)}억` : `${manwon.toLocaleString()}만`;
}
