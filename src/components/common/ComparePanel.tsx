import { useEffect, useState } from "react";
import type { DongCluster } from "@/hooks/useAllDongClusters";
import { calculateScore } from "@/utils/scoreCalc";
import { analyzeNearby, type NearbyAnalysis } from "@/services/kakaoLocal";
import { formatPrice } from "@/utils/display";
import { useAppStore } from "@/stores/useAppStore";

interface Props {
  clusters: DongCluster[];
  onClose: () => void;
}

interface ClusterStats {
  cluster: DongCluster;
  wolseAvgRent: number;
  wolseAvgDeposit: number;
  jeonseAvg: number;
  wolseCount: number;
  jeonseCount: number;
  total: number;
  rentScore: number;
  nearby: NearbyAnalysis | null;
}

function getStats(cluster: DongCluster): Omit<ClusterStats, "nearby"> {
  const wolse = cluster.transactions.filter((t) => t.dealType === "월세");
  const jeonse = cluster.transactions.filter((t) => t.dealType === "전세");

  const wolseAvgRent = wolse.length > 0
    ? Math.round(wolse.reduce((s, t) => s + (t.monthlyRent ?? 0), 0) / wolse.length)
    : 0;
  const wolseAvgDeposit = wolse.length > 0
    ? Math.round(wolse.reduce((s, t) => s + (t.depositAmount ?? 0), 0) / wolse.length)
    : 0;
  const jeonseAvg = jeonse.length > 0
    ? Math.round(jeonse.reduce((s, t) => s + (t.depositAmount ?? 0), 0) / jeonse.length)
    : 0;

  const score = calculateScore(cluster.transactions);

  return {
    cluster,
    wolseAvgRent, wolseAvgDeposit, jeonseAvg,
    wolseCount: wolse.length,
    jeonseCount: jeonse.length,
    total: score.total,
    rentScore: score.rentScore,
  };
}

export default function ComparePanel({ clusters, onClose }: Props) {
  const { focusLocation } = useAppStore();
  const [stats, setStats] = useState<ClusterStats[]>([]);

  // 각 클러스터마다 주변 시설 분석
  useEffect(() => {
    if (clusters.length < 2) return;
    let cancelled = false;

    Promise.all(
      clusters.map(async (c) => ({
        ...getStats(c),
        nearby: await analyzeNearby(c.lat, c.lng),
      }))
    ).then((results) => {
      if (!cancelled) setStats(results);
    });

    return () => { cancelled = true; };
  }, [clusters]);

  if (clusters.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-3xl">⚖️</p>
        <p className="mt-3 text-sm text-gray-500">비교할 동네를 2개 선택해주세요</p>
        <p className="mt-1 text-xs text-gray-300">지도에서 동 배지를 우클릭해 추가</p>
      </div>
    );
  }

  if (stats.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        <p className="mt-3 text-sm text-gray-400">주변 시설 분석 중...</p>
      </div>
    );
  }

  const [a, b] = stats;

  // 비교 행 (낮을수록 좋은지 / 높을수록 좋은지)
  const compareCells = (
    label: string,
    valA: string | number,
    valB: string | number,
    higherBetter: boolean,
    rawA?: number,
    rawB?: number
  ) => {
    let winner: 0 | 1 | -1 = -1;
    if (rawA !== undefined && rawB !== undefined && rawA !== rawB) {
      winner = higherBetter ? (rawA > rawB ? 0 : 1) : (rawA < rawB ? 0 : 1);
    }
    return (
      <div className="grid grid-cols-3 border-b border-gray-50 px-4 py-2.5 items-center">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-center text-sm font-semibold ${winner === 0 ? "text-primary-600" : "text-gray-700"}`}>
          {valA}{winner === 0 && <span className="ml-1 text-[10px]">👑</span>}
        </span>
        <span className={`text-center text-sm font-semibold ${winner === 1 ? "text-primary-600" : "text-gray-700"}`}>
          {valB}{winner === 1 && <span className="ml-1 text-[10px]">👑</span>}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-800">⚖️ 동네 비교</h2>
        <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100">← 닫기</button>
      </div>

      {/* 동네 헤더 */}
      <div className="grid grid-cols-3 border-b border-gray-100 px-4 py-3">
        <div />
        {[a, b].map((s, i) => (
          <button
            key={i}
            onClick={() => focusLocation(s.cluster.lat, s.cluster.lng)}
            className="text-center hover:bg-gray-50 rounded-lg py-1"
          >
            <p className="text-sm font-bold text-gray-800">{s.cluster.dongName}</p>
            <p className="text-[10px] text-gray-400">{s.cluster.shortGuName}</p>
          </button>
        ))}
      </div>

      {/* 가격 정보 */}
      <div className="bg-gray-50 px-4 py-2 text-[10px] font-semibold text-gray-500">💰 가격 정보</div>
      {compareCells("거래 건수", `${a.cluster.count}건`, `${b.cluster.count}건`, true, a.cluster.count, b.cluster.count)}

      {(a.wolseCount > 0 || b.wolseCount > 0) && (
        <>
          {compareCells("월세 평균",
            a.wolseAvgRent > 0 ? `${a.wolseAvgRent}만/월` : "-",
            b.wolseAvgRent > 0 ? `${b.wolseAvgRent}만/월` : "-",
            false,
            a.wolseAvgRent || undefined, b.wolseAvgRent || undefined)}
          {compareCells("월세 보증금 평균",
            a.wolseAvgDeposit > 0 ? formatPrice(a.wolseAvgDeposit) : "-",
            b.wolseAvgDeposit > 0 ? formatPrice(b.wolseAvgDeposit) : "-",
            false,
            a.wolseAvgDeposit || undefined, b.wolseAvgDeposit || undefined)}
        </>
      )}
      {(a.jeonseCount > 0 || b.jeonseCount > 0) &&
        compareCells("전세금 평균",
          a.jeonseAvg > 0 ? formatPrice(a.jeonseAvg) : "-",
          b.jeonseAvg > 0 ? formatPrice(b.jeonseAvg) : "-",
          false,
          a.jeonseAvg || undefined, b.jeonseAvg || undefined)}

      {/* 주변 시설 */}
      <div className="bg-gray-50 px-4 py-2 text-[10px] font-semibold text-gray-500 mt-2">🏪 주변 시설 (반경 1km)</div>
      {compareCells("🚇 지하철역",
        `${a.nearby?.transport.subway.length ?? 0}개`,
        `${b.nearby?.transport.subway.length ?? 0}개`,
        true,
        a.nearby?.transport.subway.length, b.nearby?.transport.subway.length)}
      {compareCells("🚇 가장 가까운 역",
        a.nearby?.transport.subway[0]?.distance ? `${a.nearby.transport.subway[0].distance}m` : "-",
        b.nearby?.transport.subway[0]?.distance ? `${b.nearby.transport.subway[0].distance}m` : "-",
        false,
        a.nearby?.transport.subway[0]?.distance, b.nearby?.transport.subway[0]?.distance)}
      {compareCells("🏪 편의점",
        `${a.nearby?.facilities.convenience.length ?? 0}개`,
        `${b.nearby?.facilities.convenience.length ?? 0}개`,
        true,
        a.nearby?.facilities.convenience.length, b.nearby?.facilities.convenience.length)}
      {compareCells("☕ 카페",
        `${a.nearby?.facilities.cafe.length ?? 0}개`,
        `${b.nearby?.facilities.cafe.length ?? 0}개`,
        true,
        a.nearby?.facilities.cafe.length, b.nearby?.facilities.cafe.length)}
      {compareCells("🛒 마트",
        `${a.nearby?.facilities.mart.length ?? 0}개`,
        `${b.nearby?.facilities.mart.length ?? 0}개`,
        true,
        a.nearby?.facilities.mart.length, b.nearby?.facilities.mart.length)}
      {compareCells("🏥 병원",
        `${a.nearby?.facilities.hospital.length ?? 0}개`,
        `${b.nearby?.facilities.hospital.length ?? 0}개`,
        true,
        a.nearby?.facilities.hospital.length, b.nearby?.facilities.hospital.length)}
      {compareCells("🚔 경찰서 (2km)",
        `${a.nearby?.safety.police.length ?? 0}개`,
        `${b.nearby?.safety.police.length ?? 0}개`,
        true,
        a.nearby?.safety.police.length, b.nearby?.safety.police.length)}

      {/* 종합 점수 비교 */}
      <div className="px-4 py-4">
        <h3 className="mb-3 text-xs font-semibold text-gray-500">🏆 종합 점수</h3>
        {[a, b].map((s, i) => {
          const color = s.total >= 70 ? "#22c55e" : s.total >= 40 ? "#f59e0b" : "#ef4444";
          return (
            <div key={i} className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{s.cluster.dongName}</span>
                <span className="text-xs font-bold" style={{ color }}>{s.total}점</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.total}%`, backgroundColor: i === 0 ? "#3b82f6" : "#f59e0b" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
