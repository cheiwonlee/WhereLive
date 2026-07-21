import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { searchFoods, FoodSearchResult, estimateServingGrams } from '../lib/fatsecret';
import { useAppStore } from '../store/useAppStore';
import { useSyncedActions } from '../hooks/useSyncedActions';
import { MealSlot, MEAL_SLOTS, FoodEntry } from '../types';

// 카테고리 클릭 시 의미 있는 검색 시드
const CATEGORIES: { emoji: string; label: string; seed: string }[] = [
  { emoji: '🍚', label: '한식', seed: '밥' },
  { emoji: '🥟', label: '중식', seed: '짜장면' },
  { emoji: '🍣', label: '일식', seed: '초밥' },
  { emoji: '🍝', label: '양식', seed: '파스타' },
  { emoji: '🍔', label: '패스트푸드', seed: '햄버거' },
  { emoji: '🍰', label: '카페/디저트', seed: '케이크' },
  { emoji: '🥫', label: '가공식품', seed: '라면' },
  { emoji: '✏️', label: '직접입력', seed: '__focus__' },
];

// 위해가능영양소 임계값 (100g 기준)
const HIGH = {
  sodium: 600,    // mg
  sugar: 17,      // g
  saturated: 5,   // g
  trans: 0.5,     // g
  cholesterol: 150, // mg
};

interface CartItem {
  food: FoodSearchResult;
  servings: number; // 100g 기준 배수
}

export default function AddFood() {
  const { slot } = useParams<{ slot: MealSlot }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addEntries } = useSyncedActions();
  const entries = useAppStore((s) => s.entries);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  const slotLabel = MEAL_SLOTS.find((s) => s.key === slot)?.label ?? '식단';
  const targetDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const isToday = targetDate === format(new Date(), 'yyyy-MM-dd');

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['foods', query],
    queryFn: () => searchFoods(query),
    enabled: query.length > 0,
  });

  const recent = useMemo(
    () => Array.from(new Map(entries.slice(-15).reverse().map((e) => [e.name, e])).values()).slice(0, 5),
    [entries]
  );

  function addToCart(food: FoodSearchResult) {
    const next = new Map(cart);
    if (next.has(food.id)) {
      next.delete(food.id);
    } else {
      // 기본 1인분으로 시작
      const grams = estimateServingGrams(food.category, food.name);
      next.set(food.id, { food, servings: grams / 100 });
    }
    setCart(next);
  }

  function updateServings(id: string, servings: number) {
    const next = new Map(cart);
    const item = next.get(id);
    if (item) {
      next.set(id, { ...item, servings: Math.max(0.1, servings) });
      setCart(next);
    }
  }

  function removeFromCart(id: string) {
    const next = new Map(cart);
    next.delete(id);
    setCart(next);
  }

  async function handleSubmit() {
    if (cart.size === 0 || !slot) return;
    const newEntries: FoodEntry[] = Array.from(cart.values()).map((item) => ({
      id: crypto.randomUUID(),
      name: item.food.name,
      slot,
      date: targetDate,
      servings: item.servings,
      nutrients: item.food.nutrients,
      createdAt: Date.now(),
    }));
    await addEntries(newEntries);
    navigate('/');
  }

  function handleCategoryClick(seed: string) {
    if (seed === '__focus__') {
      setQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuery(seed);
    }
  }

  const cartTotalCal = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.food.nutrients.calories * item.servings, 0
  );

  return (
    <div className={`min-h-screen ${cart.size > 0 ? 'pb-56' : 'pb-32'}`}>
      {/* Top bar */}
      <div className="px-6 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-black/[0.05] grid place-items-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div>
          <div className="text-[11px] tracking-[0.18em] text-sage-500 font-semibold">
            {isToday ? 'ADD MEAL' : format(new Date(targetDate), 'yyyy.MM.dd')}
          </div>
          <h1 className="display text-2xl">{slotLabel}<span className="text-sage-400">.</span></h1>
        </div>
      </div>

      {/* Search */}
      <div className="px-6">
        <div className="bg-white rounded-2xl px-5 py-4 border border-black/[0.05] flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink/30">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 배추김치, 신라면, 삼겹살구이"
            className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-ink/30"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink/30 text-sm">✕</button>
          )}
        </div>
      </div>

      {/* Camera buttons */}
      <div className="px-6 mt-3 grid grid-cols-2 gap-3">
        <button onClick={() => navigate(`/scan/${slot}`)} className="bg-sage-50 rounded-2xl py-4 flex flex-col items-center gap-1 border border-black/[0.04] active:scale-95 transition">
          <span className="text-2xl">📷</span>
          <span className="text-[12px] font-medium text-ink/70">사진으로 촬영</span>
        </button>
        <button onClick={() => navigate(`/scan/${slot}`)} className="bg-butter/15 rounded-2xl py-4 flex flex-col items-center gap-1 border border-black/[0.04] active:scale-95 transition">
          <span className="text-2xl">🖼️</span>
          <span className="text-[12px] font-medium text-ink/70">갤러리에서</span>
        </button>
      </div>

      {/* Recent */}
      {recent.length > 0 && !query && (
        <div className="px-6 mt-6">
          <div className="text-[11px] tracking-wider text-ink/40 font-semibold mb-2">최근 선택한 음식</div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r.id} onClick={() => setQuery(r.name)} className="px-3 py-1.5 rounded-full bg-white border border-black/[0.06] text-[12px] text-ink/70">
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories or results */}
      {query ? (
        <div className="px-6 mt-5">
          <div className="text-[11px] tracking-wider text-ink/40 font-semibold mb-2">
            {isFetching ? '검색 중…' : `검색 결과 ${results.length}건`}
          </div>
          <div className="space-y-2">
            {results.map((r) => {
              const isSelected = cart.has(r.id);
              return (
                <FoodResultCard
                  key={r.id}
                  food={r}
                  selected={isSelected}
                  onToggle={() => addToCart(r)}
                />
              );
            })}
            {!isFetching && results.length === 0 && (
              <div className="bg-white rounded-2xl p-6 text-center text-[13px] text-ink/40">
                검색 결과가 없어요. 다른 검색어를 시도해보세요.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-6 mt-6">
          <div className="text-[11px] tracking-wider text-ink/40 font-semibold mb-3">음식 카테고리</div>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((c) => (
              <button key={c.label} onClick={() => handleCategoryClick(c.seed)} className="bg-white rounded-2xl py-4 border border-black/[0.04] active:scale-95 transition">
                <div className="text-2xl">{c.emoji}</div>
                <div className="text-[11px] text-ink/60 mt-1">{c.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sticky cart */}
      {cart.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="mx-auto max-w-[440px] bg-white border-t border-black/[0.08] shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
            <div className="px-5 pt-3 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-ink text-cream display text-xs grid place-items-center">{cart.size}</div>
                <span className="text-[12px] font-semibold">선택한 음식</span>
              </div>
              <span className="display text-base tabular-nums">{Math.round(cartTotalCal)} kcal</span>
            </div>
            <div className="px-5 pb-2 max-h-44 overflow-y-auto space-y-2">
              {Array.from(cart.values()).map((item) => {
                const grams = item.servings * 100;
                return (
                  <div key={item.food.id} className="flex items-center gap-2 bg-cream rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate">{item.food.name}</div>
                      <div className="text-[10px] text-ink/40">{Math.round(grams)}g · {Math.round(item.food.nutrients.calories * item.servings)}kcal</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateServings(item.food.id, item.servings - 0.5)} className="w-6 h-6 rounded-full bg-ink/[0.06] text-xs grid place-items-center">−</button>
                      <span className="text-[11px] tabular-nums w-8 text-center font-semibold">{item.servings.toFixed(1)}</span>
                      <button onClick={() => updateServings(item.food.id, item.servings + 0.5)} className="w-6 h-6 rounded-full bg-ink/[0.06] text-xs grid place-items-center">+</button>
                      <button onClick={() => removeFromCart(item.food.id)} className="w-6 h-6 grid place-items-center text-ink/30 hover:text-coral text-xs ml-1">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 pb-6 pt-2">
              <button onClick={handleSubmit} className="btn-primary">
                {slotLabel}에 {cart.size}개 등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FoodResultCard({ food, selected, onToggle }: { food: FoodSearchResult; selected: boolean; onToggle: () => void }) {
  const n = food.nutrients;
  const risks: { label: string; color: string }[] = [];
  if (n.sodium > HIGH.sodium) risks.push({ label: '고나트륨', color: 'bg-coral/15 text-coral' });
  if (n.sugar > HIGH.sugar) risks.push({ label: '고당류', color: 'bg-coral/15 text-coral' });
  if (n.saturated > HIGH.saturated) risks.push({ label: '고포화지방', color: 'bg-coral/15 text-coral' });
  if (n.trans > HIGH.trans) risks.push({ label: '트랜스지방', color: 'bg-coral/15 text-coral' });
  if (n.cholesterol > HIGH.cholesterol) risks.push({ label: '고콜레스테롤', color: 'bg-coral/15 text-coral' });

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-2xl p-4 border transition ${
        selected ? 'bg-sage-50 border-sage-300' : 'bg-white border-black/[0.04]'
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[14px] truncate">{food.name}</div>
          <div className="text-[10px] text-ink/40 mt-0.5">{food.brand} · {food.servingDescription}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="display text-lg tabular-nums leading-none">{Math.round(n.calories)}</div>
          <div className="text-[9px] text-ink/40">kcal</div>
        </div>
        <div className={`shrink-0 w-7 h-7 rounded-full grid place-items-center text-sm transition ${
          selected ? 'bg-sage-500 text-cream' : 'bg-ink/[0.06] text-ink/40'
        }`}>
          {selected ? '✓' : '+'}
        </div>
      </div>

      {/* Macro grid */}
      <div className="grid grid-cols-4 gap-1 mt-3 text-center">
        <NutCell label="탄수" value={n.carbs} unit="g" />
        <NutCell label="단백" value={n.protein} unit="g" />
        <NutCell label="지방" value={n.fat} unit="g" />
        <NutCell label="나트륨" value={n.sodium} unit="mg" warn={n.sodium > HIGH.sodium} />
      </div>

      {/* Risk badges */}
      {risks.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {risks.map((r) => (
            <span key={r.label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.color}`}>
              ⚠️ {r.label}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function NutCell({ label, value, unit, warn }: { label: string; value: number; unit: string; warn?: boolean }) {
  return (
    <div className="bg-ink/[0.03] rounded-lg py-1.5">
      <div className={`text-[11px] tabular-nums font-semibold ${warn ? 'text-coral' : 'text-ink/80'}`}>
        {value < 10 ? value.toFixed(1) : Math.round(value)}<span className="text-[9px] text-ink/40 font-normal">{unit}</span>
      </div>
      <div className="text-[9px] text-ink/40">{label}</div>
    </div>
  );
}
