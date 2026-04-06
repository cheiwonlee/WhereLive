import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { RealTransaction } from "@/types";

interface Props {
  transactions: RealTransaction[];
  dongName: string;
}

interface MonthlyData {
  month: string;
  avgDeposit: number;
  avgRent: number;
  count: number;
}

function aggregateByMonth(txs: RealTransaction[]): MonthlyData[] {
  const map = new Map<string, { deposits: number[]; rents: number[] }>();

  for (const tx of txs) {
    const key = `${tx.dealYear}.${String(tx.dealMonth).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, { deposits: [], rents: [] });
    const bucket = map.get(key)!;
    bucket.deposits.push(tx.depositAmount ?? 0);
    if (tx.monthlyRent && tx.monthlyRent > 0) {
      bucket.rents.push(tx.monthlyRent);
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { deposits, rents }]) => ({
      month,
      avgDeposit: Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length),
      avgRent: rents.length > 0
        ? Math.round(rents.reduce((a, b) => a + b, 0) / rents.length)
        : 0,
      count: deposits.length,
    }));
}

function formatManwon(val: number): string {
  if (val >= 10000) return `${(val / 10000).toFixed(1)}억`;
  return `${val.toLocaleString()}만`;
}

export default function PriceTrendChart({ transactions, dongName }: Props) {
  const data = aggregateByMonth(transactions);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-400">
        차트 데이터가 부족합니다
      </div>
    );
  }

  const hasRent = data.some((d) => d.avgRent > 0);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        📈 {dongName} 가격 추이
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            tickFormatter={formatManwon}
          />
          <Tooltip
            formatter={(value, name) => [
              formatManwon(Number(value)),
              name === "avgDeposit" ? "평균 보증금" : "평균 월세",
            ]}
            labelFormatter={(label) => `${label}`}
            contentStyle={{
              fontSize: "12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "10px" }}
            formatter={(value) =>
              value === "avgDeposit" ? "보증금" : "월세"
            }
          />
          <Bar
            dataKey="avgDeposit"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
          {hasRent && (
            <Bar
              dataKey="avgRent"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-gray-300">
        최근 3개월 거래 기준
      </p>
    </div>
  );
}
