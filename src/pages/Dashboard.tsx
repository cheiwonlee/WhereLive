import { useMemo, useState } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import Header from '../components/Header';
import { useAppStore, sumNutrients, dailyCalorieTarget } from '../store/useAppStore';

const SODIUM_QUESTIONS = [
  '라면이나 국수, 우동을 자주 먹는다',
  '통조림(생선, 장조림 등)을 자주 먹는다',
  '베이컨, 햄, 소시지를 자주 먹는다',
  '튀김이나 어묵에 간장을 찍어 먹는다',
  '간식으로 과일보다 감자칩이나 과자를 자주 먹는다',
  '국이나 찌개의 국물을 다 먹는다',
  '싱거운 음식은 잘 먹지 않는다',
  '외식을 자주 한다',
  '햄버거나 피자를 자주 먹는다',
  '인스턴트 식품이나 반조리 식품을 자주 먹는다',
];

export default function Dashboard() {
  const { entries, gender } = useAppStore();
  const today = new Date();
  const yesterdayKey = format(subDays(today, 1), 'yyyy-MM-dd');
  const yesterdayEntries = useMemo(() => entries.filter((e) => e.date === yesterdayKey), [entries, yesterdayKey]);
  const yTotals = useMemo(() => sumNutrients(yesterdayEntries), [yesterdayEntries]);
  const calTarget = dailyCalorieTarget(gender);

  // 최근 7일 데이터
  const weekData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    return days.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const dayEntries = entries.filter((e) => e.date === key);
      const totals = sumNutrients(dayEntries);
      return {
        day: format(d, 'EEEEE', { locale: ko }),
        date: format(d, 'M/d'),
        calories: Math.round(totals.calories),
        fat: Math.round(totals.fat * 10) / 10,
        saturated: Math.round(totals.saturated * 10) / 10,
      };
    });
  }, [entries, today.toDateString()]);

  const weekAvgCal = Math.round(weekData.reduce((s, d) => s + d.calories, 0) / 7);

  const [checks, setChecks] = useState<boolean[]>(Array(10).fill(false));
  const score = checks.filter(Boolean).length;
  const risk = score <= 3 ? { label: '안전', color: 'text-sage-600', bg: 'bg-sage-50' }
            : score <= 6 ? { label: '주의', color: 'text-butter', bg: 'bg-butter/15' }
            : { label: '위험', color: 'text-coral', bg: 'bg-coral/10' };

  const hasYesterdayData = yesterdayEntries.length > 0;
  const highSat = yTotals.saturated > 22;

  return (
    <div className="pb-32">
      <Header date={today} subtitle="REPORT" />

      <div className="px-6 mt-2">
        <h2 className="display text-2xl">어제의 건강 리포트<span className="text-sage-400">.</span></h2>
        <p className="text-[12px] text-ink/40 mt-1">{format(subDays(today, 1), 'yyyy년 M월 d일')} 기록 분석</p>
      </div>

      {/* Risk card */}
      <div className="px-6 mt-5">
        {hasYesterdayData ? (
          <div className={`rounded-3xl p-5 ${highSat ? 'bg-coral/10 border border-coral/20' : 'bg-sage-50 border border-sage-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{highSat ? '⚠️' : '💚'}</span>
              <h3 className={`font-bold text-[15px] ${highSat ? 'text-coral' : 'text-sage-600'}`}>
                {highSat ? '동맥경화증 발병 위험 주의' : '균형잡힌 하루였어요'}
              </h3>
            </div>
            <p className="text-[13px] leading-relaxed text-ink/70">
              {highSat
                ? '어제는 동물성 포화지방(삼겹살, 튀김 등) 섭취가 다소 많았어요. 혈중 콜레스테롤이 높아지면 혈관에 쌓여 심혈관계 질환 확률이 올라가요.'
                : '어제 섭취한 지방의 균형이 권장 범위 안에 있어요. 이 페이스를 유지해보세요!'}
            </p>
          </div>
        ) : (
          <div className="rounded-3xl p-6 bg-white border border-black/[0.04] text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-[13px] text-ink/50">어제 기록된 식단이 없어요</p>
          </div>
        )}
      </div>

      {/* Weekly trend chart */}
      <div className="px-6 mt-4">
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <div>
              <div className="text-[11px] tracking-wider text-ink/40 font-semibold">최근 7일</div>
              <h3 className="display text-lg mt-0.5">주간 칼로리 흐름</h3>
            </div>
            <div className="text-right">
              <div className="display text-2xl tabular-nums">{weekAvgCal.toLocaleString()}</div>
              <div className="text-[10px] text-ink/40 -mt-1">평균 kcal</div>
            </div>
          </div>
          <div className="h-36 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#1A1F1C66' }}
                />
                <ReferenceLine y={calTarget} stroke="#E66E5A" strokeDasharray="3 3" strokeWidth={1} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{
                    background: '#1A1F1C',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 11,
                    padding: '6px 10px',
                  }}
                  labelStyle={{ color: '#FBF9F4', fontWeight: 600 }}
                  itemStyle={{ color: '#FBF9F4' }}
                  formatter={(v: number) => [`${v.toLocaleString()} kcal`, '섭취']}
                />
                <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                  {weekData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.calories > calTarget ? '#E66E5A' : d.calories > 0 ? '#9CB893' : '#1A1F1C10'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-ink/50 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-sage-300" /> 정상
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-coral" /> 초과
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-px bg-coral border-t border-dashed" /> 권장 {calTarget.toLocaleString()}kcal
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="px-6 mt-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <span>💡</span>
            <h3 className="font-bold text-[14px]">이렇게 바꿔보세요</h3>
          </div>
          <Tip title="기름기 적은 부위 선택하기" body="고기는 삼겹살보다 목살이나 안심을 골라보세요." />
          <Tip title="착한 지방으로 채우기" body="아보카도, 견과류 한 줌으로 간식을 바꿔보는 건 어떨까요?" />
        </div>
      </div>

      {/* Lipid dictionary */}
      <div className="px-6 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span>📖</span>
          <h3 className="display text-lg">알기 쉬운 지질 사전</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sage-50 rounded-2xl p-4 border border-sage-100">
            <div className="text-[11px] text-sage-600 font-semibold">착한 식물성 지방</div>
            <div className="text-[10px] text-ink/40">불포화지방산 (혈관청소)</div>
            <div className="text-2xl mt-3">🥑 🥜 🐟</div>
            <div className="text-[11px] text-ink/60 mt-2">아보카도, 견과류, 등푸른 생선, 올리브유</div>
          </div>
          <div className="bg-coral/10 rounded-2xl p-4 border border-coral/20">
            <div className="text-[11px] text-coral font-semibold">주의 동물성 지방</div>
            <div className="text-[10px] text-ink/40">포화·트랜스지방 (혈관막힘)</div>
            <div className="text-2xl mt-3">🥩 🍔 🧈</div>
            <div className="text-[11px] text-ink/60 mt-2">삼겹살, 버터, 마가린, 가공육</div>
          </div>
        </div>
      </div>

      {/* Sodium checklist */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="display text-lg">나의 염분 섭취 습관</h3>
          <span className={`pill ${risk.bg} ${risk.color} font-semibold`}>{risk.label} {score}/10</span>
        </div>
        <div className="card !p-0 overflow-hidden">
          {SODIUM_QUESTIONS.map((q, i) => (
            <label
              key={i}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-black/[0.04] last:border-0 cursor-pointer active:bg-ink/[0.02]"
            >
              <button
                type="button"
                onClick={() => setChecks(checks.map((c, idx) => (idx === i ? !c : c)))}
                className={`w-5 h-5 rounded-md border-2 grid place-items-center transition ${
                  checks[i] ? 'bg-ink border-ink text-cream' : 'border-ink/15'
                }`}
              >
                {checks[i] && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[13px] text-ink/80 flex-1">{q}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3 py-2">
      <div className="w-5 h-5 rounded-full bg-sage-100 grid place-items-center mt-0.5">
        <div className="w-2 h-2 rounded-full bg-sage-500" />
      </div>
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[12px] text-ink/50">{body}</div>
      </div>
    </div>
  );
}
