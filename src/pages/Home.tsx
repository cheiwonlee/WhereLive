import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import Header from '../components/Header';
import { useAppStore, sumNutrients, dailyCalorieTarget } from '../store/useAppStore';
import { useSyncedActions } from '../hooks/useSyncedActions';
import { MEAL_SLOTS } from '../types';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const navigate = useNavigate();
  const { entries, gender } = useAppStore();
  const { removeEntry } = useSyncedActions();

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayEntries = useMemo(() => entries.filter((e) => e.date === dateKey), [entries, dateKey]);
  const totals = useMemo(() => sumNutrients(dayEntries), [dayEntries]);

  const calTarget = dailyCalorieTarget(gender);
  const fatTargetG = (calTarget * 0.2) / 9;
  const carbTargetG = Math.round((calTarget * 0.55) / 4);
  const proteinTargetG = Math.round((calTarget * 0.15) / 4);

  // 위해가능영양소 누적 경고
  const overCalories = totals.calories > calTarget;
  const overFat = totals.fat * 9 > calTarget * 0.2;
  const overSodium = totals.sodium > 2000;
  const overSugar = totals.sugar > 50;
  const severeLipid =
    totals.cholesterol > 300 || totals.saturated > 22 || totals.trans > 2;

  function navigateToAdd(slotKey: string) {
    navigate(`/add/${slotKey}?date=${dateKey}`);
  }

  return (
    <div className="pb-32">
      <Header date={selectedDate} />

      {/* 캘린더 */}
      <div className="px-6">
        {calendarMode === 'week' ? (
          <WeekStrip
            date={selectedDate}
            onSelect={setSelectedDate}
            entries={entries}
          />
        ) : (
          <MonthGrid
            month={calendarMonth}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            onPrev={() => setCalendarMonth(subMonths(calendarMonth, 1))}
            onNext={() => setCalendarMonth(addMonths(calendarMonth, 1))}
            entries={entries}
          />
        )}
        <button
          onClick={() => setCalendarMode(calendarMode === 'week' ? 'month' : 'week')}
          className="w-full mt-2 flex items-center justify-center gap-1 text-[11px] text-ink/40 py-1"
        >
          {calendarMode === 'week' ? '월간 보기' : '주간 보기'}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {calendarMode === 'week'
              ? <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        </button>
      </div>

      {/* 경고 배너들 */}
      <div className="px-6 mt-4 space-y-2">
        {severeLipid && (
          <div className="rounded-3xl p-5 bg-coral/10 border border-coral/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🚨</span>
              <h3 className="font-bold text-coral text-[15px]">심각: 지질 과다 섭취</h3>
            </div>
            <p className="text-[12px] leading-relaxed text-ink/70">
              혈중 콜레스테롤 농도가 높아져 혈관 내벽에 침착되면 <b>동맥경화증</b>의 발병률이 높아져요.
              비만, 암, 심혈관계 질환의 위험도 함께 올라가요.
            </p>
            <p className="text-[11px] mt-3 text-ink/60">
              💡 포화지방(고기 비계, 버터)을 줄이고, 불포화지방(생선·견과·올리브유) 위주로 식단을 바꿔보세요.
            </p>
          </div>
        )}
        {overCalories && <Banner emoji="🔥" title="일일 권장 칼로리 초과" body={`하루 권장 ${calTarget.toLocaleString()}kcal를 초과했어요.`} />}
        {overFat && !severeLipid && <Banner emoji="🥩" title="지방 섭취 과다" body="총 에너지의 20%를 초과했어요." />}
        {overSodium && <Banner emoji="🧂" title="나트륨 과다" body="권장량 2,000mg을 초과했어요. 고혈압·위암 위험!" />}
        {overSugar && <Banner emoji="🍰" title="당류 과다" body="WHO 권장량 50g을 초과했어요. 비만·당뇨 위험!" />}
      </div>

      {/* 영양 카드 */}
      <div className="px-6 mt-5">
        <div className="card">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] tracking-wider text-ink/40 font-semibold">CALORIES</span>
            <span className="text-[11px] text-ink/40">/ {calTarget.toLocaleString()} kcal</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="display text-6xl text-ink leading-none tabular-nums">{Math.round(totals.calories).toLocaleString()}</span>
            <span className="text-sm text-ink/40 mb-1">kcal</span>
          </div>

          <div className="mt-5 space-y-3">
            <Macro label="탄수화물" value={totals.carbs} target={carbTargetG} color="#9CB893" />
            <Macro label="단백질" value={totals.protein} target={proteinTargetG} color="#F5C56B" />
            <Macro label="지방" value={totals.fat} target={Math.round(fatTargetG)} color="#E66E5A" />
          </div>

          {/* 상세 영양성분 */}
          <div className="mt-5 pt-5 border-t border-black/[0.06]">
            <div className="text-[10px] tracking-wider text-ink/40 font-semibold mb-3">상세 영양성분</div>

            {/* 지질 분석 */}
            <div className="text-[10px] text-ink/30 mb-1">지질 분석</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] mb-3">
              <NutRow label="포화지방" value={totals.saturated} unit="g" warn={totals.saturated > 22} />
              <NutRow label="트랜스지방" value={totals.trans} unit="g" warn={totals.trans > 2} />
              <NutRow label="불포화지방" value={totals.unsaturated} unit="g" good />
              <NutRow label="콜레스테롤" value={totals.cholesterol} unit="mg" warn={totals.cholesterol > 300} />
            </div>

            {/* 위해가능영양소 */}
            <div className="text-[10px] text-ink/30 mb-1">위해가능영양소</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] mb-3">
              <NutRow label="나트륨" value={totals.sodium} unit="mg" warn={totals.sodium > 2000} />
              <NutRow label="당류" value={totals.sugar} unit="g" warn={totals.sugar > 50} />
            </div>

            {/* 기타 */}
            <div className="text-[10px] text-ink/30 mb-1">기타</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
              <NutRow label="식이섬유" value={totals.fiber} unit="g" good />
            </div>
          </div>
        </div>
      </div>

      {/* 식단 슬롯 */}
      <div className="px-6 mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📋</span>
          <h2 className="display text-xl">Timeline</h2>
        </div>
        <div className="space-y-2">
          {MEAL_SLOTS.map((slot) => {
            const slotEntries = dayEntries.filter((e) => e.slot === slot.key);
            const slotCal = slotEntries.reduce((s, e) => s + e.nutrients.calories * e.servings, 0);
            return (
              <div key={slot.key} className="bg-white rounded-2xl p-4 border border-black/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span>{slot.emoji}</span>
                    <span className="font-semibold text-[14px]">{slot.label}</span>
                    {slotCal > 0 && (
                      <span className="text-[11px] text-ink/40 tabular-nums">{Math.round(slotCal)} kcal</span>
                    )}
                  </div>
                  <button onClick={() => navigateToAdd(slot.key)} className="text-[12px] font-medium text-sage-600 bg-sage-50 px-3 py-1.5 rounded-full active:scale-95 transition">
                    + 추가
                  </button>
                </div>
                {slotEntries.length === 0 ? (
                  <p className="text-[12px] text-ink/30 mt-2">등록된 식단이 없어요</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {slotEntries.map((e) => (
                      <li key={e.id} className="flex justify-between items-center text-[12px]">
                        <span className="text-ink/70 truncate flex-1 min-w-0">
                          {e.name} <span className="text-ink/30">×{e.servings.toFixed(1)}</span>
                        </span>
                        <button onClick={() => removeEntry(e.id)} className="text-ink/30 hover:text-coral text-xs ml-2 shrink-0">✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekStrip({ date, onSelect, entries }: { date: Date; onSelect: (d: Date) => void; entries: any[] }) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex justify-between">
      {weekDays.map((d) => {
        const isSelected = isSameDay(d, date);
        const isToday = isSameDay(d, new Date());
        const hasEntries = entries.some((e) => e.date === format(d, 'yyyy-MM-dd'));
        return (
          <button key={d.toISOString()} onClick={() => onSelect(d)} className="flex flex-col items-center gap-2 py-2 w-9">
            <span className={`text-[10px] tracking-wider ${isSelected ? 'text-ink' : 'text-ink/30'}`}>
              {format(d, 'EEEEE', { locale: ko })}
            </span>
            <span className={`relative w-9 h-9 rounded-full grid place-items-center text-sm transition ${
              isSelected ? 'bg-ink text-cream font-semibold' : isToday ? 'text-sage-600 font-semibold' : 'text-ink/60'
            }`}>
              {format(d, 'd')}
              {hasEntries && !isSelected && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-sage-500" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MonthGrid({ month, selectedDate, onSelect, onPrev, onNext, entries }: any) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={onPrev} className="w-7 h-7 grid place-items-center text-ink/40">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span className="display text-base">{format(month, 'yyyy년 M월', { locale: ko })}</span>
        <button onClick={onNext} className="w-7 h-7 grid place-items-center text-ink/40">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
          <div key={w} className="text-center text-[10px] text-ink/30 py-1">{w}</div>
        ))}
        {days.map((d: Date) => {
          const isSelected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, new Date());
          const isCurrentMonth = isSameMonth(d, month);
          const hasEntries = entries.some((e: any) => e.date === format(d, 'yyyy-MM-dd'));
          return (
            <button key={d.toISOString()} onClick={() => onSelect(d)} className="aspect-square grid place-items-center">
              <span className={`relative w-8 h-8 rounded-full grid place-items-center text-[12px] transition ${
                isSelected ? 'bg-ink text-cream font-semibold'
                : !isCurrentMonth ? 'text-ink/15'
                : isToday ? 'text-sage-600 font-semibold'
                : 'text-ink/60'
              }`}>
                {format(d, 'd')}
                {hasEntries && !isSelected && isCurrentMonth && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-sage-500" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Banner({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl p-4 bg-butter/15 border border-butter/30">
      <div className="flex items-start gap-3">
        <span className="text-base mt-0.5">{emoji}</span>
        <div>
          <h3 className="font-semibold text-ink text-[14px]">{title}</h3>
          <p className="text-[12px] text-ink/60 mt-0.5">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Macro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[12px] text-ink/60">{label}</span>
        <span className="text-[12px] tabular-nums">
          <span className="font-semibold text-ink">{value.toFixed(1)}</span>
          <span className="text-ink/30"> / {target}g</span>
        </span>
      </div>
      <div className="h-1.5 bg-ink/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function NutRow({ label, value, unit, warn, good }: { label: string; value: number; unit: string; warn?: boolean; good?: boolean }) {
  const color = warn ? 'text-coral' : good ? 'text-sage-600' : 'text-ink';
  return (
    <div className="flex justify-between">
      <span className="text-ink/50">{label}</span>
      <span className={`tabular-nums font-medium ${color}`}>
        {value.toFixed(value < 10 ? 1 : 0)}{unit}
      </span>
    </div>
  );
}
