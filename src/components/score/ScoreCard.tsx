import { useEffect, useState } from "react";
import type { RealTransaction } from "@/types";
import type { DongCluster } from "@/hooks/useAllDongClusters";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { analyzeNearby, type NearbyAnalysis } from "@/services/kakaoLocal";

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
  affordabilityRatio: number;
}

function calcRentScore(txs: RealTransaction[], budget: number): { rentScore: number; avgMonthlyRent: number; avgDeposit: number; medianRent: number; affordabilityRatio: number } {
  const wolse = txs.filter((t) => t.dealType === "월세");
  const deposits = txs.map((t) => t.depositAmount ?? 0).filter((d) => d > 0);
  const avgMonthlyRent = wolse.length > 0 ? Math.round(wolse.reduce((s, t) => s + (t.monthlyRent ?? 0), 0) / wolse.length) : 0;
  const avgDeposit = deposits.length > 0 ? Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length) : 0;
  const sortedRents = wolse.map((t) => t.monthlyRent ?? 0).sort((a, b) => a - b);
  const medianRent = sortedRents.length > 0 ? sortedRents[Math.floor(sortedRents.length / 2)] : 0;
  const affordabilityRatio = budget > 0 && avgMonthlyRent > 0 ? Math.round((avgMonthlyRent / budget) * 100) : 0;
  const BASELINE = budget > 0 ? budget * 0.3 : 70;
  const rentScore = avgMonthlyRent > 0 ? Math.min(100, Math.max(0, Math.round((1 - avgMonthlyRent / (BASELINE * 2)) * 100))) : 50;
  return { rentScore, avgMonthlyRent, avgDeposit, medianRent, affordabilityRatio };
}

export function calculateWeightedScore(scores: { rentScore: number; facilityScore: number; transportScore: number; safetyScore: number; quietScore: number }, weights: Record<string, number>): number {
  const w = { affordability: weights.affordability ?? 80, transport: weights.transport ?? 70, safety: weights.safety ?? 60, convenience: weights.convenience ?? 50, quiet: weights.quiet ?? 30 };
  const total = w.affordability + w.transport + w.safety + w.convenience + w.quiet;
  if (total === 0) return 50;
  return Math.round((scores.rentScore * w.affordability + scores.transportScore * w.transport + scores.safetyScore * w.safety + scores.facilityScore * w.convenience + scores.quietScore * w.quiet) / total);
}

function getScoreColor(s: number) { return s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444"; }
function getScoreLabel(s: number) { return s >= 80 ? "최고" : s >= 70 ? "좋음" : s >= 50 ? "보통" : s >= 30 ? "낮음" : "매우 낮음"; }

interface Props { cluster: DongCluster; allTransactions: RealTransaction[]; }

export default function ScoreCard({ cluster }: Props) {
  const { prefs } = usePreferenceStore();
  const [nearby, setNearby] = useState<NearbyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // 카카오 로컬 API로 실제 주변 시설 분석
  useEffect(() => {
    setLoading(true);
    analyzeNearby(cluster.lat, cluster.lng).then((result) => {
      setNearby(result);
      setLoading(false);
    });
  }, [cluster.lat, cluster.lng]);

  const rent = calcRentScore(cluster.transactions, prefs.budget);
  const scores = {
    rentScore: rent.rentScore,
    facilityScore: nearby?.scores.facilityScore ?? 50,
    transportScore: nearby?.scores.transportScore ?? 50,
    safetyScore: nearby?.scores.safetyScore ?? 50,
    quietScore: nearby?.scores.quietScore ?? 50,
  };
  const weightedTotal = calculateWeightedScore(scores, prefs.weights);

  const bars = [
    { label: "가격 가성비", score: scores.rentScore, icon: "💰" },
    { label: "대중교통", score: scores.transportScore, icon: "🚇", detail: nearby ? `지하철 ${nearby.transport.subway.length}개 (1km 이내)` : undefined },
    { label: "치안·안전", score: scores.safetyScore, icon: "🛡️", detail: nearby ? `경찰서 ${nearby.safety.police.length}개 (2km 이내)` : undefined },
    { label: "편의시설", score: scores.facilityScore, icon: "🏪", detail: nearby ? `편의점 ${nearby.facilities.convenience.length} · 카페 ${nearby.facilities.cafe.length} · 병원 ${nearby.facilities.hospital.length}` : undefined },
    { label: "조용한 환경", score: scores.quietScore, icon: "🌿" },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">🏆 {cluster.dongName} 가성비 분석</h3>

      <div className="mb-4 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-white text-xl font-bold"
          style={{ backgroundColor: getScoreColor(weightedTotal) }}>
          {loading ? "..." : weightedTotal}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-800">{loading ? "분석 중" : getScoreLabel(weightedTotal)}</p>
          <p className="text-xs text-gray-400">{prefs.budget > 0 ? `월 ${prefs.budget.toLocaleString()}만 기준` : "내 선호 조건 반영"}</p>
        </div>
      </div>

      {prefs.budget > 0 && rent.avgMonthlyRent > 0 && (
        <div className={`mb-4 rounded-lg p-3 text-xs ${rent.affordabilityRatio <= 30 ? "bg-green-50 text-green-700" : rent.affordabilityRatio <= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
          {rent.affordabilityRatio <= 30 ? `✅ 적정! 소득의 ${rent.affordabilityRatio}%` : rent.affordabilityRatio <= 50 ? `⚠️ 다소 부담. 소득의 ${rent.affordabilityRatio}% (권장 30% 이하)` : `🚨 과도. 소득의 ${rent.affordabilityRatio}%`}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {bars.map(({ label, score, icon, detail }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-gray-600">{icon} {label}</span>
              <span className="text-xs font-semibold" style={{ color: getScoreColor(score) }}>{score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }} />
            </div>
            {detail && <p className="text-[10px] text-gray-400 mt-0.5">{detail}</p>}
          </div>
        ))}
      </div>

      {/* 주변 시설 요약 */}
      {nearby && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">📍 주변 시설 (반경 1km)</h4>
          <div className="grid grid-cols-3 gap-1.5">
            <FacBadge icon="🏪" label="편의점" count={nearby.facilities.convenience.length} />
            <FacBadge icon="🛒" label="마트" count={nearby.facilities.mart.length} />
            <FacBadge icon="☕" label="카페" count={nearby.facilities.cafe.length} />
            <FacBadge icon="🏥" label="병원" count={nearby.facilities.hospital.length} />
            <FacBadge icon="💊" label="약국" count={nearby.facilities.pharmacy.length} />
            <FacBadge icon="🏦" label="은행" count={nearby.facilities.bank.length} />
            <FacBadge icon="🚇" label="지하철" count={nearby.transport.subway.length} near={nearby.transport.subway[0]?.distance} />
            <FacBadge icon="🚔" label="경찰서" count={nearby.safety.police.length} />
            <FacBadge icon="🏫" label="학교" count={nearby.education.school.length} />
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBox label="평균 월세" value={`${rent.avgMonthlyRent.toLocaleString()}만`} />
        <StatBox label="중앙값" value={`${rent.medianRent.toLocaleString()}만`} />
        <StatBox label="평균 보증금" value={fmtD(rent.avgDeposit)} />
      </div>
    </div>
  );
}

function FacBadge({ icon, label, count, near }: { icon: string; label: string; count: number; near?: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-1.5 text-center">
      <p className="text-sm">{icon}</p>
      <p className="text-[10px] font-semibold text-gray-700">{count}개</p>
      <p className="text-[9px] text-gray-400">{label}</p>
      {near !== undefined && <p className="text-[9px] text-primary-500">{near}m</p>}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (<div className="rounded-lg bg-gray-50 p-2 text-center"><p className="text-[10px] text-gray-400">{label}</p><p className="text-xs font-bold text-gray-700">{value}</p></div>);
}

function fmtD(m: number) { return m >= 10000 ? `${(m / 10000).toFixed(1)}억` : `${m.toLocaleString()}만`; }
