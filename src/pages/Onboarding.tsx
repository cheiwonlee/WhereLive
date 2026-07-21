import { useSyncedActions } from '../hooks/useSyncedActions';

export default function Onboarding() {
  const { setGender } = useSyncedActions();

  return (
    <div className="min-h-screen flex flex-col px-7 py-16 bg-cream">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-2 text-[11px] tracking-[0.22em] text-sage-500 font-semibold">CLEARPLATE</div>
        <h1 className="display text-[44px] leading-[1.05] text-ink">
          매일의 접시를<br />
          <span className="italic text-sage-500">깨끗하게.</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ink/60 max-w-[300px]">
          정확한 권장 칼로리 계산을 위해<br />성별을 알려주세요.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setGender('female')}
          className="w-full group rounded-3xl bg-white border border-black/[0.06] p-6 text-left active:scale-[0.99] transition shadow-soft"
        >
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-ink/40 mb-1">FEMALE</div>
              <div className="display text-2xl">여성</div>
            </div>
            <div className="text-right">
              <div className="display text-3xl text-sage-500">2,000</div>
              <div className="text-[11px] text-ink/40 -mt-1">kcal / day</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => setGender('male')}
          className="w-full group rounded-3xl bg-white border border-black/[0.06] p-6 text-left active:scale-[0.99] transition shadow-soft"
        >
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-ink/40 mb-1">MALE</div>
              <div className="display text-2xl">남성</div>
            </div>
            <div className="text-right">
              <div className="display text-3xl text-sage-500">2,600</div>
              <div className="text-[11px] text-ink/40 -mt-1">kcal / day</div>
            </div>
          </div>
        </button>
      </div>

      <p className="text-center text-[11px] text-ink/30 mt-8">
        2020 한국인 영양소 섭취 기준 (20대 성인 기준)
      </p>
    </div>
  );
}
