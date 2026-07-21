import { useEffect, useState } from 'react';

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InstallGuide({ open, onClose }: Props) {
  const [platform, setPlatform] = useState<Platform>('desktop');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[440px] bg-cream rounded-t-[32px] p-6 pb-10 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-ink/10 rounded-full mx-auto mb-5" />

        <div className="text-[11px] tracking-[0.18em] text-sage-500 font-semibold">INSTALL</div>
        <h2 className="display text-2xl mt-1">홈 화면에 추가하기<span className="text-sage-400">.</span></h2>
        <p className="text-[13px] text-ink/50 mt-2 leading-relaxed">
          ClearPlate를 앱처럼 설치해서 빠르게 열어보세요.<br />
          앱 아이콘만 탭하면 바로 식단 기록이 시작돼요.
        </p>

        {/* Tabs */}
        <div className="mt-5 flex gap-2 bg-white rounded-2xl p-1 border border-black/[0.05]">
          {(['ios', 'android', 'desktop'] as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition ${
                platform === p ? 'bg-ink text-cream' : 'text-ink/40'
              }`}
            >
              {p === 'ios' ? 'iPhone' : p === 'android' ? 'Android' : 'Desktop'}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="mt-5 space-y-3">
          {platform === 'ios' && (
            <>
              <Step n={1} title="Safari에서 열기" body="Chrome이나 다른 브라우저가 아니라 꼭 Safari로 이 페이지를 여세요." />
              <Step
                n={2}
                title="공유 버튼 탭하기"
                body="화면 하단(또는 상단)의 공유 아이콘을 누르세요."
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              />
              <Step n={3} title="'홈 화면에 추가' 선택" body="공유 메뉴를 아래로 스크롤해서 찾으세요. 사각형 안에 + 표시가 있어요." />
              <Step n={4} title="이름 확인 후 '추가' 탭" body="ClearPlate라는 이름으로 홈 화면에 아이콘이 생겨요." />
            </>
          )}

          {platform === 'android' && (
            <>
              <Step n={1} title="Chrome에서 열기" body="Chrome 브라우저에서 이 페이지를 여세요." />
              <Step n={2} title="우측 상단 메뉴 열기" body="주소창 옆의 점 세 개(⋮) 메뉴를 탭하세요." />
              <Step n={3} title="'앱 설치' 또는 '홈 화면에 추가'" body="메뉴에서 해당 항목을 선택하세요. 자동으로 설치 안내가 나올 수도 있어요." />
              <Step n={4} title="설치 완료" body="홈 화면과 앱 서랍에 ClearPlate 아이콘이 추가돼요." />
            </>
          )}

          {platform === 'desktop' && (
            <>
              <Step n={1} title="Chrome 또는 Edge에서 열기" body="데스크탑 Chrome이나 Microsoft Edge를 사용하세요." />
              <Step
                n={2}
                title="주소창의 설치 아이콘 클릭"
                body="주소창 오른쪽에 작은 모니터 + 다운로드 화살표 모양 아이콘이 있어요."
              />
              <Step n={3} title="'설치' 클릭" body="팝업이 뜨면 '설치'를 누르세요. 별도 창에서 ClearPlate가 열려요." />
            </>
          )}
        </div>

        {/* Tip */}
        <div className="mt-5 rounded-2xl p-4 bg-sage-50 border border-sage-100 flex gap-3">
          <span className="text-base shrink-0">💡</span>
          <p className="text-[12px] leading-relaxed text-sage-600">
            설치하면 풀스크린으로 열리고, 인터넷이 잠깐 끊겨도 이미 기록한 식단은 계속 볼 수 있어요.
          </p>
        </div>

        <button onClick={onClose} className="btn-primary mt-5">알겠어요</button>
      </div>
    </div>
  );
}

function Step({
  n, title, body, icon,
}: { n: number; title: string; body: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-black/[0.04] flex gap-3">
      <div className="w-7 h-7 rounded-full bg-ink text-cream grid place-items-center display text-sm shrink-0">
        {n}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold">{title}</h3>
          {icon && <span className="text-ink/40">{icon}</span>}
        </div>
        <p className="text-[12px] text-ink/50 mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
