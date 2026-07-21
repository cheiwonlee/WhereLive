# 🥗 ClearPlate · 클리어플레이트

> 매일 먹는 식사 접시(Plate)에서 해로운 영양소를 깨끗하게(Clear) 비워내는, 지질 관리 특화 식단 기록 앱

모바일 우선(Mobile-First) 웹앱. React + TypeScript + Vite + Tailwind + Supabase 로 만들었어요.

## ✨ 주요 기능

- **Supabase 이메일 인증** + 클라우드 양방향 동기화 (로컬 즉시 반영, 백그라운드로 DB push)
- **온보딩**: 성별 기반 일일 권장 칼로리 (여 2,000 / 남 2,600)
- **홈**: 주간 캘린더 + 4대 영양소 + 상세 지질 8종 추적
- **3단계 경고 시스템**: 칼로리 → 지방 → 콜레스테롤 심각 경고
- **식단 기록**: 7개 시간대 슬롯 + FatSecret API 음식 검색
- **카메라 스캐너**: 영양성분표 촬영 / 갤러리 업로드 (OCR stub 포함)
- **리포트**: Recharts 주간 트렌드 차트 + 어제 분석 + 염분 자가진단 10문항
- **설정**: 프로필 · 성별 재설정 · 로그아웃
- **PWA**: 홈 화면 설치 가능 (manifest + apple-touch-icon)
- **콘텐츠**: 지질/당류/나트륨 카테고리별 영양 아티클

## 🚀 빠른 시작

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 (없어도 mock 데이터로 동작해요)
cp .env.example .env

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. **Chrome DevTools → 모바일 뷰**로 보면 가장 예뻐요.

## 📦 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | React 18 + TypeScript + Vite |
| 스타일 | Tailwind CSS (Pretendard + Fraunces 폰트) |
| 상태관리 | Zustand (localStorage 자동 영속화) |
| 데이터 패칭 | TanStack Query |
| 라우팅 | React Router v6 |
| DB / 인증 | Supabase |
| 음식 데이터 | FatSecret Platform API |
| 배포 | Vercel |

## 🗂 폴더 구조

```
src/
├── pages/         # Onboarding, Home, AddFood, Dashboard, Articles
├── components/    # Header, BottomNav
├── store/         # Zustand 전역 상태
├── lib/           # supabase 클라이언트, fatsecret 서비스
├── data/          # 정적 콘텐츠 (articles)
└── types.ts       # 전역 타입
supabase/
├── schema.sql                    # DB 스키마 + RLS 정책
└── functions/foods-search/       # FatSecret 프록시 Edge Function
```

## 🔐 FatSecret API 키 — 절대 프론트엔드에 넣지 말 것!

FatSecret이 발급해주는 **Client ID와 Client Secret은 서버에만 저장**해야 해요. `.env`에 `VITE_` 접두사로 넣으면 빌드 번들에 그대로 박혀서 누구나 브라우저에서 볼 수 있어요.

### ❌ 잘못된 방법
```env
# 절대 이렇게 하지 마세요!
VITE_FATSECRET_CLIENT_ID=xxx
VITE_FATSECRET_CLIENT_SECRET=xxx
```

### ✅ 올바른 방법 — Supabase Edge Function의 Secrets

```bash
# 1. Supabase CLI 설치
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF

# 2. 키를 Supabase 서버에 secrets로 등록 (이게 핵심!)
supabase secrets set FATSECRET_CLIENT_ID=발급받은_Client_ID
supabase secrets set FATSECRET_CLIENT_SECRET=발급받은_Client_Secret

# 3. 함수 배포
supabase functions deploy foods-search
```

키는 `supabase/functions/foods-search/index.ts`에서 `Deno.env.get()`으로 읽혀요:
```ts
const id = Deno.env.get('FATSECRET_CLIENT_ID')!;
const secret = Deno.env.get('FATSECRET_CLIENT_SECRET')!;
```

프론트엔드 `.env`에는 **함수 URL만** 넣으면 돼요 (이건 공개돼도 안전):
```env
VITE_FATSECRET_PROXY_URL=https://YOUR-PROJECT.supabase.co/functions/v1/foods-search
```

> 💡 FatSecret 대시보드 → "IP Restrictions"에서 테스트 중에는 `0.0.0.0/0`으로 풀어두세요. 안 그러면 "Invalid IP" 에러가 나요.



## 🗄 Supabase 셋업

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. **SQL Editor** → `supabase/schema.sql` 내용 붙여넣고 실행
3. **Settings → API** 에서 URL과 anon key 복사 → `.env`에 입력

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> 현재 코드는 localStorage 기반으로 동작해요(Zustand persist). Supabase 연동은 인증을 붙인 뒤 `useAppStore`의 액션에서 `supabase.from('food_entries').insert(...)`를 호출하도록 확장하면 됩니다.

## 🌍 Vercel 배포

```bash
npm install -g vercel
vercel
```

또는 GitHub 저장소를 Vercel 대시보드에서 연결하면 push할 때마다 자동 배포.

**Vercel 환경변수 설정**: Project Settings → Environment Variables 에 `.env` 내용을 그대로 등록.

`vercel.json`에 SPA fallback rewrite가 이미 들어있어요.

## 🎨 디자인 노트

흔한 "AI 보라색 그라데이션" 톤을 피하고 **편집 매거진 + 카페 메뉴판** 분위기를 노렸어요:

- **컬러**: 크림(#FBF9F4) 배경 + 세이지 그린 + 잉크 블랙. 강조는 코랄(#E66E5A)과 버터(#F5C56B).
- **타이포**: 본문 Pretendard (한글 최적화), 디스플레이 Fraunces (영문 세리프, 이탤릭으로 포인트).
- **레이아웃**: `max-w-[440px]` 모바일 컨테이너. 데스크탑에서도 모바일 프레임 그대로 중앙 정렬.
- **숫자가 주인공**: 칼로리·지방량 같은 핵심 데이터를 큰 세리프 폰트로 강조.

## 📋 다음 단계 아이디어

- [ ] Supabase Auth (이메일/카카오 로그인)
- [ ] localStorage → Supabase 동기화
- [ ] 카메라 OCR 영양성분표 스캐너 (Google ML Kit 또는 Vision API)
- [ ] 주간 / 월간 트렌드 차트 (Recharts — Sarah의 익숙한 스택!)
- [ ] PWA 매니페스트 추가 (홈 화면 설치)
- [ ] 다크 모드

---

만든이: 이채원 (Sarah) · 2026
