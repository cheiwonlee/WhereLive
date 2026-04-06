import type { RealTransaction } from "@/types";

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
}

/**
 * 실거래가 기반 기본 점수 계산 (카카오 로컬 API 없이)
 * ComparePanel 등에서 빠른 비교용으로 사용
 */
export function calculateScore(txs: RealTransaction[]): ScoreResult {
  const wolse = txs.filter((t) => t.dealType === "월세");
  const deposits = txs.map((t) => t.depositAmount ?? 0).filter((d) => d > 0);

  const avgMonthlyRent = wolse.length > 0
    ? Math.round(wolse.reduce((s, t) => s + (t.monthlyRent ?? 0), 0) / wolse.length)
    : 0;
  const avgDeposit = deposits.length > 0
    ? Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length)
    : 0;
  const sortedRents = wolse.map((t) => t.monthlyRent ?? 0).sort((a, b) => a - b);
  const medianRent = sortedRents.length > 0 ? sortedRents[Math.floor(sortedRents.length / 2)] : 0;

  const BASELINE = 70;
  const rentScore = avgMonthlyRent > 0
    ? Math.min(100, Math.max(0, Math.round((1 - avgMonthlyRent / (BASELINE * 2)) * 100)))
    : 50;

  const count = txs.length;
  const facilityScore = Math.min(100, Math.max(20, Math.round(30 + count * 1.2)));
  const transportScore = Math.min(100, Math.max(20, Math.round(25 + count * 1.0)));
  const safetyScore = Math.min(100, Math.max(30, Math.round(40 + count * 0.8)));
  const quietScore = Math.min(100, Math.max(10, Math.round(80 - count * 0.5)));

  const total = Math.round(
    rentScore * 0.4 + facilityScore * 0.15 + transportScore * 0.2 +
    safetyScore * 0.15 + quietScore * 0.1
  );

  return { total, rentScore, facilityScore, transportScore, safetyScore, quietScore, avgMonthlyRent, avgDeposit, medianRent };
}
