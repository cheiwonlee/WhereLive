# 🏠 어디살지? (WhereLive)

> 청년을 위한 동네별 주거 가성비 분석 서비스

"내 월급으로 어디가 가성비 좋아?" — 동네별 월세 + 편의시설 + 교통을 종합한 가성비 점수를 지도 위에 시각화합니다.

## 주요 기능

- **지도 기반 실거래가 조회** — 카카오맵 위에 실거래가 데이터 시각화
- **검색 & 필터** — 지역/거래유형/가격/면적별 필터링
- **가격 추이 차트** — 동네별 월세·전세 가격 변동 추이
- **가성비 점수** — 월세(40%) + 편의시설(30%) + 교통(30%) 종합 분석
- **동네 비교** — 최대 2개 동네 나란히 비교
- **예산 추천** — 월급 입력 → 적정 월세 범위 내 추천 동네

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand + TanStack Query |
| Map | 카카오맵 SDK (react-kakao-maps-sdk) |
| Chart | Recharts |
| Backend | Supabase (DB + Auth + Edge Functions) |
| Deploy | Vercel |

## 시작하기

```bash
git clone https://github.com/your-username/wherelive.git
cd wherelive
npm install
cp .env.example .env   # API 키 입력
npm run dev
```

### 환경변수

- **VITE_KAKAO_APP_KEY**: [developers.kakao.com](https://developers.kakao.com) → JavaScript 키
- **VITE_DATA_GO_KR_KEY**: [data.go.kr](https://data.go.kr) → 국토교통부 실거래가 API

## 프로젝트 구조

```
src/
├── components/
│   ├── common/      # Layout, SidebarNav
│   ├── map/         # KakaoMap, KakaoMapProvider
│   ├── filter/      # 검색/필터 컴포넌트
│   ├── chart/       # Recharts 차트
│   └── score/       # 가성비 점수 UI
├── pages/           # HomePage, DetailPage, ComparePage, BudgetPage
├── hooks/           # TanStack Query 커스텀 훅
├── stores/          # Zustand 스토어
├── services/        # API 호출 레이어
├── types/           # TypeScript 타입 정의
├── utils/           # 유틸리티 함수
└── constants/       # 상수
```

## 라이선스

MIT
