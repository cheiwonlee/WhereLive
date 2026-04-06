import type { RealTransaction } from "@/types";
import type { DongCluster } from "@/hooks/useAllDongClusters";

export interface ScoreResult {
  total: number;
  rentScore: number;
  facilityScore: number;
  transportScore: number;
  avgMonthlyRent: number;
  avgDeposit: number;
  medianRent: number;
}

/**
 * 가성비 점수 산정
 * 
 * 종합 점수 = 월세 점수(40%) + 편의시설 점수(30%) + 교통 점수(30%)
 * 
 * 월세 점수: 평균 월세가 낮을수록 높은 점수
 * - 서울 평균 월세(약 70만원) 기준으로 정규화
 * 
 * 편의시설/교통 점수: 추후 카카오 로컬 API 연동 시 구현
 * - 현재는 거래 건수 기반 추정값 사용
 */
export function calculateScore(
  transactions: RealTransaction[],
  _allTransactions?: RealTransaction[]
): ScoreResult {
  const wolse = transactions.filter((t) => t.dealType === "월세");
  const deposits = transactions.map((t) => t.depositAmount ?? 0).filter((d) => d > 0);

  // 평균 월세
  const avgMonthlyRent = wolse.length > 0
    ? Math.round(wolse.reduce((s, t) => s + (t.monthlyRent ?? 0), 0) / wolse.length)
    : 0;

  // 평균 보증금
  const avgDeposit = deposits.length > 0
    ? Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length)
    : 0;

  // 중앙값 월세
  const sortedRents = wolse.map((t) => t.monthlyRent ?? 0).sort((a, b) => a - b);
  const medianRent = sortedRents.length > 0
    ? sortedRents[Math.floor(sortedRents.length / 2)]
    : 0;

  // 월세 점수 (0~100): 서울 평균 ~70만원 기준
  // 월세가 낮을수록 높은 점수
  const BASELINE_RENT = 70; // 서울 평균 월세 (만원)
  const rentScore = avgMonthlyRent > 0
    ? Math.min(100, Math.max(0, Math.round((1 - avgMonthlyRent / (BASELINE_RENT * 2)) * 100)))
    : 50; // 데이터 없으면 50점

  // 편의시설 점수 (추후 카카오 로컬 API 연동)
  // 현재: 거래 건수 기반 추정 (거래가 많은 지역 = 인프라 풍부 추정)
  const txCount = transactions.length;
  const facilityScore = Math.min(100, Math.max(20, Math.round(30 + txCount * 1.5)));

  // 교통 점수 (추후 지하철역/버스 데이터 연동)
  // 현재: 편의시설 점수와 유사한 추정
  const transportScore = Math.min(100, Math.max(20, Math.round(25 + txCount * 1.2)));

  // 종합 점수
  const total = Math.round(
    rentScore * 0.4 + facilityScore * 0.3 + transportScore * 0.3
  );

  return {
    total,
    rentScore,
    facilityScore,
    transportScore,
    avgMonthlyRent,
    avgDeposit,
    medianRent,
  };
}

// 점수에 따른 색상
function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e"; // 높음
  if (score >= 40) return "#f59e0b"; // 보통
  return "#ef4444"; // 낮음
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
  const score = calculateScore(cluster.transactions);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        🏆 {cluster.dongName} 가성비 점수
      </h3>

      {/* 총점 */}
      <div className="mb-4 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-white text-xl font-bold"
          style={{ backgroundColor: getScoreColor(score.total) }}
        >
          {score.total}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-800">
            {getScoreLabel(score.total)}
          </p>
          <p className="text-xs text-gray-400">
            {cluster.dongName} 종합 가성비
          </p>
        </div>
      </div>

      {/* 세부 점수 바 */}
      <div className="flex flex-col gap-3">
        <ScoreBar label="월세 가성비" score={score.rentScore} weight="40%" />
        <ScoreBar label="편의시설" score={score.facilityScore} weight="30%" hint="추정값" />
        <ScoreBar label="교통" score={score.transportScore} weight="30%" hint="추정값" />
      </div>

      {/* 요약 통계 */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBox label="평균 월세" value={`${score.avgMonthlyRent.toLocaleString()}만`} />
        <StatBox label="중앙값 월세" value={`${score.medianRent.toLocaleString()}만`} />
        <StatBox label="평균 보증금" value={formatDeposit(score.avgDeposit)} />
      </div>
    </div>
  );
}

function ScoreBar({ label, score, weight, hint }: {
  label: string; score: number; weight: string; hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">
          {label}
          <span className="ml-1 text-gray-300">({weight})</span>
          {hint && <span className="ml-1 text-[10px] text-amber-400">*{hint}</span>}
        </span>
        <span className="text-xs font-semibold" style={{ color: getScoreColor(score) }}>
          {score}점
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: getScoreColor(score),
          }}
        />
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

function formatDeposit(manwon: number): string {
  if (manwon >= 10000) {
    return `${(manwon / 10000).toFixed(1)}억`;
  }
  return `${manwon.toLocaleString()}만`;
}
