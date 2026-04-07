import { useEffect, useState } from "react";
import type { RealTransaction } from "@/types";
import type { DongCluster } from "@/hooks/useAllDongClusters";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { analyzeNearby, type NearbyAnalysis, type NearbyPlace } from "@/services/kakaoLocal";
import FacilityListModal from "@/components/common/FacilityListModal";
import { useAppStore } from "@/stores/useAppStore";

function calcRentScore(txs: RealTransaction[], budget: number) {
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

const getColor = (s: number) => s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";
const getLabel = (s: number) => s >= 80 ? "최고" : s >= 70 ? "좋음" : s >= 50 ? "보통" : s >= 30 ? "낮음" : "매우 낮음";
const fmtD = (m: number) => m >= 10000 ? `${(m / 10000).toFixed(1)}억` : `${m.toLocaleString()}만`;

interface FacModalState {
  title: string;
  icon: string;
  places: NearbyPlace[];
}

interface Props { cluster: DongCluster; allTransactions: RealTransaction[]; }

export default function ScoreCard({ cluster }: Props) {
  const { prefs } = usePreferenceStore();
  const { focusLocation } = useAppStore();
  const [nearby, setNearby] = useState<NearbyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<FacModalState | null>(null);

  useEffect(() => {
    setLoading(true);
    setNearby(null);
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
          style={{ backgroundColor: getColor(weightedTotal) }}>
          {loading ? "..." : weightedTotal}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-800">{loading ? "분석 중" : getLabel(weightedTotal)}</p>
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
              <span className="text-xs font-semibold" style={{ color: getColor(score) }}>{score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: getColor(score) }} />
            </div>
            {detail && <p className="text-[10px] text-gray-400 mt-0.5">{detail}</p>}
          </div>
        ))}
      </div>

      {/* 주변 시설 - 클릭하면 리스트 모달 */}
      {nearby && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">📍 주변 시설 (클릭해서 자세히)</h4>
          <div className="grid grid-cols-3 gap-1.5">
            <FacBtn icon="🏪" label="편의점" places={nearby.facilities.convenience}
              onClick={() => setModal({ title: "편의점", icon: "🏪", places: nearby.facilities.convenience })} />
            <FacBtn icon="🛒" label="마트" places={nearby.facilities.mart}
              onClick={() => setModal({ title: "마트", icon: "🛒", places: nearby.facilities.mart })} />
            <FacBtn icon="☕" label="카페" places={nearby.facilities.cafe}
              onClick={() => setModal({ title: "카페", icon: "☕", places: nearby.facilities.cafe })} />
            <FacBtn icon="🏥" label="병원" places={nearby.facilities.hospital}
              onClick={() => setModal({ title: "병원", icon: "🏥", places: nearby.facilities.hospital })} />
            <FacBtn icon="💊" label="약국" places={nearby.facilities.pharmacy}
              onClick={() => setModal({ title: "약국", icon: "💊", places: nearby.facilities.pharmacy })} />
            <FacBtn icon="🏦" label="은행" places={nearby.facilities.bank}
              onClick={() => setModal({ title: "은행", icon: "🏦", places: nearby.facilities.bank })} />
            <FacBtn icon="🚇" label="지하철" places={nearby.transport.subway} near={nearby.transport.subway[0]?.distance}
              onClick={() => setModal({ title: "지하철역", icon: "🚇", places: nearby.transport.subway })} />
            <FacBtn icon="🚔" label="경찰서" places={nearby.safety.police}
              onClick={() => setModal({ title: "경찰서", icon: "🚔", places: nearby.safety.police })} />
            <FacBtn icon="🏫" label="학교" places={nearby.education.school}
              onClick={() => setModal({ title: "학교", icon: "🏫", places: nearby.education.school })} />
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBox label="평균 월세" value={`${rent.avgMonthlyRent.toLocaleString()}만`} />
        <StatBox label="중앙값" value={`${rent.medianRent.toLocaleString()}만`} />
        <StatBox label="평균 보증금" value={fmtD(rent.avgDeposit)} />
      </div>

      {modal && (
        <FacilityListModal
          title={modal.title}
          icon={modal.icon}
          places={modal.places}
          onClose={() => setModal(null)}
          onPlaceClick={(p) => focusLocation(p.lat, p.lng)}
        />
      )}
    </div>
  );
}

function FacBtn({ icon, label, places, near, onClick }: { icon: string; label: string; places: NearbyPlace[]; near?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg bg-gray-50 p-1.5 text-center hover:bg-primary-50 transition-colors">
      <p className="text-sm">{icon}</p>
      <p className="text-[10px] font-semibold text-gray-700">{places.length}개</p>
      <p className="text-[9px] text-gray-400">{label}</p>
      {near !== undefined && <p className="text-[9px] text-primary-500">{near}m</p>}
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (<div className="rounded-lg bg-gray-50 p-2 text-center"><p className="text-[10px] text-gray-400">{label}</p><p className="text-xs font-bold text-gray-700">{value}</p></div>);
}
