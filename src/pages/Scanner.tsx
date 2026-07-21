import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useSyncedActions } from '../hooks/useSyncedActions';
import { MealSlot, MEAL_SLOTS, EMPTY_NUTRIENTS, Nutrients } from '../types';

/**
 * 영양성분표 OCR 스캐너.
 *
 * 실제 OCR 연동은 두 가지 옵션이 있어요:
 * 1. Google Cloud Vision API (텍스트 추출 정확도 ★★★★★, 유료)
 * 2. Tesseract.js (브라우저 무료, 한글 정확도 ★★★)
 *
 * 카메라 접근 → 사진 캡처 → base64 → Supabase Edge Function으로 전송 →
 * Vision API 호출 → 영양성분 파싱 → 결과 반환 흐름이 가장 안전해요.
 *
 * 지금은 데모를 위해 mock 결과를 보여줍니다.
 */
export default function Scanner() {
  const { slot } = useParams<{ slot: MealSlot }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ name: string; nutrients: Nutrients } | null>(null);
  const { addEntry } = useSyncedActions();

  const slotLabel = MEAL_SLOTS.find((s) => s.key === slot)?.label ?? '식단';

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setScanning(true);

    // TODO: 실제 OCR 호출. 지금은 mock.
    setTimeout(() => {
      setScanning(false);
      setResult({
        name: '스캔된 음식',
        nutrients: {
          ...EMPTY_NUTRIENTS,
          calories: 285, carbs: 32, protein: 12, fat: 14,
          saturated: 5.2, mono: 6.1, poly: 2.3, trans: 0.1,
          cholesterol: 45, sodium: 480, fiber: 2.1, sugar: 6,
        },
      });
    }, 1500);
  }

  async function handleSave() {
    if (!result || !slot) return;
    await addEntry({
      id: crypto.randomUUID(),
      name: result.name,
      slot,
      date: format(new Date(), 'yyyy-MM-dd'),
      servings: 1,
      nutrients: result.nutrients,
      createdAt: Date.now(),
    });
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-ink text-cream relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 pt-12 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur grid place-items-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-[10px] tracking-[0.2em] text-cream/50 font-semibold">SCAN</div>
          <div className="display text-base">{slotLabel}</div>
        </div>
        <div className="w-10" />
      </div>

      {/* Viewfinder */}
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="" className="rounded-3xl max-h-[60vh] object-cover" />
            {scanning && (
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <div className="absolute inset-x-0 h-1 bg-sage-300 shadow-[0_0_20px_rgba(156,184,147,0.8)] animate-scan" />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="relative w-72 h-72">
              {/* Corner brackets */}
              <Corner className="top-0 left-0" />
              <Corner className="top-0 right-0 rotate-90" />
              <Corner className="bottom-0 right-0 rotate-180" />
              <Corner className="bottom-0 left-0 -rotate-90" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-cream/60 text-sm">영양성분표를 사각형 안에 맞춰주세요</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!preview && (
          <div className="mt-12 grid grid-cols-2 gap-3 w-full max-w-xs">
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-cream text-ink rounded-2xl py-4 font-semibold text-sm active:scale-95 transition"
            >
              📸 촬영
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-white/10 backdrop-blur rounded-2xl py-4 font-semibold text-sm active:scale-95 transition"
            >
              🖼️ 갤러리
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* Result modal */}
      {result && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setResult(null)}>
          <div
            className="w-full max-w-[440px] bg-cream text-ink rounded-t-[32px] p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-ink/10 rounded-full mx-auto mb-4" />
            <div className="text-[11px] tracking-wider text-sage-500 font-semibold">SCANNED</div>
            <input
              type="text"
              value={result.name}
              onChange={(e) => setResult({ ...result, name: e.target.value })}
              className="display text-2xl mt-1 bg-transparent w-full outline-none border-b border-ink/10 pb-1"
            />

            <div className="mt-5 grid grid-cols-4 gap-2 text-center">
              <Stat label="kcal" value={Math.round(result.nutrients.calories)} />
              <Stat label="탄수" value={`${result.nutrients.carbs.toFixed(1)}g`} />
              <Stat label="단백" value={`${result.nutrients.protein.toFixed(1)}g`} />
              <Stat label="지방" value={`${result.nutrients.fat.toFixed(1)}g`} />
            </div>

            <button onClick={handleSave} className="btn-primary mt-5">기록하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Corner({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute w-8 h-8 ${className}`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-sage-300 rounded-full" />
      <div className="absolute top-0 left-0 w-1 h-full bg-sage-300 rounded-full" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl py-3">
      <div className="display text-lg tabular-nums">{value}</div>
      <div className="text-[10px] text-ink/40">{label}</div>
    </div>
  );
}
