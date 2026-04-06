# 🏠 어디살지? (WhereLive)

> 청년을 위한 동네별 주거 가성비 분석 서비스

"내 월급으로 어디가 가성비 좋아?" — 실거래가 데이터를 기반으로 동네별 가성비를 분석하고 지도 위에 시각화합니다.

## 핵심 기능

- **지도 기반 탐색** — 지도를 움직이면 해당 지역 실거래가가 자동으로 표시
- **동별 거래 배지** — 직방/다방 스타일 거래 건수 + 동 이름 표시
- **가성비 점수** — 가격·교통·치안·편의시설·환경 5개 항목 종합 분석
- **사용자 맞춤 분석** — 월급, 선호 조건 입력 → 개인화된 가성비 점수
- **가격 추이 차트** — 보증금/월세 듀얼 Y축 차트
- **동네 비교** — 2개 동네 나란히 비교
- **반전세 분류** — 한국부동산원 기준 (보증금 > 월세 × 240)
- **전국 지원** — 서울 + 전국 250개 시/군/구

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Data Fetching | TanStack Query (useQueries 멀티 병렬) |
| Map | 카카오맵 SDK (react-kakao-maps-sdk) |
| Chart | Recharts (듀얼 Y축) |
| Deploy | Vercel |

## 시작하기

```bash
git clone https://github.com/your-username/wherelive.git
cd wherelive
npm install
cp .env.example .env   # API 키 입력
npm run dev
```

### 환경변수 (.env)

```env
VITE_KAKAO_APP_KEY=카카오_JavaScript_키
VITE_DATA_GO_KR_KEY=공공데이터포털_인증키
```

- **카카오맵**: [developers.kakao.com](https://developers.kakao.com) → 앱 → 플랫폼 키 → JavaScript 키
- **공공데이터**: [data.go.kr](https://data.go.kr) → 국토교통부 오피스텔/아파트/연립다세대 전월세 API

### 카카오맵 도메인 등록

앱 → 플랫폼 키 → JavaScript 키 → JavaScript SDK 도메인에 등록:
- 개발: `http://localhost:5173`
- 배포: `https://your-app.vercel.app`

## 배포 (Vercel)

```bash
npm install -g vercel
vercel
```

환경변수를 Vercel 대시보드에서도 설정해야 합니다:
- `VITE_KAKAO_APP_KEY`
- `VITE_DATA_GO_KR_KEY`

## 프로젝트 구조

```
src/
├── components/
│   ├── chart/       # PriceTrendChart (Recharts 듀얼 Y축)
│   ├── common/      # Layout, DongDetailPanel, ComparePanel
│   ├── filter/      # FilterBar, PlaceSearch, PreferencePanel, DualRangeFilter
│   ├── map/         # KakaoMap, DongOverlay, MapControls
│   └── score/       # ScoreCard (가성비 점수)
├── constants/       # regionCodes, regionCenters, dongCoords
├── hooks/           # useMultiGuTransactions, useAllDongClusters
├── pages/           # HomePage
├── services/        # api.ts (공공데이터 XML 파싱)
├── stores/          # useAppStore, usePreferenceStore
├── types/           # TypeScript 타입
└── utils/           # geocode, display, getVisibleGus
```

## 사용 API

| API | 용도 |
|-----|------|
| 국토교통부 실거래가 (3종) | 아파트/오피스텔/연립다세대 전월세 데이터 |
| 카카오맵 SDK | 지도, 마커, 오버레이 |
| 카카오 Places API | 장소 키워드 검색 |
| 카카오 Geocoder | 주소 → 좌표 변환 |

## 가성비 점수 산정 기준

- **가격 가성비 (가중치 조절 가능)**: 소득 대비 주거비 비율(RIR) 기반, 국토교통부 권장 30% 이하
- **대중교통**: 추정값 (추후 카카오 로컬 API 연동)
- **치안·안전**: 추정값 (추후 경찰청 데이터 연동)
- **편의시설**: 추정값 (추후 카카오 로컬 API 연동)
- **조용한 환경**: 추정값 (추후 생활인구 데이터 연동)

## 라이선스

MIT
