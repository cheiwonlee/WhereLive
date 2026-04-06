import { useState, useEffect } from "react";

const STORAGE_KEY = "wherelive_onboarded";

const steps = [
  {
    icon: "🗺️",
    title: "지도를 돌아다녀 보세요",
    desc: "지도를 이동하거나 줌인하면 해당 지역의 실거래가가 자동으로 표시됩니다.",
  },
  {
    icon: "🔵",
    title: "동 배지를 클릭하세요",
    desc: "파란색(월세 비중)·초록색(전세 비중) 동 배지를 클릭하면 가성비 분석과 가격 추이를 볼 수 있습니다.",
  },
  {
    icon: "⚖️",
    title: "우클릭으로 동네 비교",
    desc: "동 배지를 마우스 우클릭하면 비교 대상에 추가됩니다. 2개를 선택하면 나란히 비교할 수 있어요.",
  },
  {
    icon: "⚙️",
    title: "내 조건에 맞게 설정",
    desc: "사이드바에서 월급, 선호 조건을 설정하면 나에게 맞는 가성비 점수를 볼 수 있습니다.",
  },
  {
    icon: "🔍",
    title: "검색으로 빠르게 이동",
    desc: "검색창에 동 이름, 역, 건물명을 입력하면 해당 위치로 바로 이동합니다.",
  },
];

export default function OnboardingGuide() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, []);

  function handleClose() {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  }

  if (!show) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {/* 진행도 */}
        <div className="mb-4 flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* 아이콘 */}
        <div className="mb-3 text-center text-4xl">{current.icon}</div>

        {/* 타이틀 */}
        <h2 className="mb-2 text-center text-lg font-bold text-gray-800">
          {current.title}
        </h2>

        {/* 설명 */}
        <p className="mb-6 text-center text-sm text-gray-500 leading-relaxed">
          {current.desc}
        </p>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="flex-1 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            {step < steps.length - 1 ? "다음" : "시작하기"}
          </button>
        </div>

        {/* 페이지 표시 */}
        <p className="mt-3 text-center text-xs text-gray-300">
          {step + 1} / {steps.length}
        </p>
      </div>
    </div>
  );
}
