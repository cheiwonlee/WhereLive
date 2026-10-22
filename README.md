# 🏠 어디살지? · WhereLive

> 청년 1인 가구를 위한 **전국 주거 가성비 분석 서비스**

카카오맵 기반으로 전국 250개 시·군·구의 실거래가 데이터를 조회하고, 동네별 교통·치안·편의시설 점수를 비교해 나에게 맞는 동네를 찾아주는 웹앱이에요.

## ✨ 주요 기능

- **실거래가 조회**: 국토교통부 공공 API로 아파트·오피스텔·연립다세대 월세/전세 실거래 데이터 (최근 3개월)
- **전국 250개 지역**: 17개 시·도, 250개 시·군·구 지원 (뷰포트 기반 자동 로딩)
- **카카오맵 연동**: 동별 매물 수 뱃지 (파란색=월세, 초록색=전세, 보라색=반전세)
- **동네 점수 분석**: 카카오 Local API로 실제 주변시설 기반 5가지 점수 산출
  - 가격 가성비 (RIR 기반, 국토부 30% 기준)
  - 대중교통 (지하철 1km 이내 검색)
  - 치안 (파출소/경찰서 2km 이내)
  - 편의시설 (마트·편의점·병원·카페·은행·세탁소)
  - 조용한 환경 (편의점·카페 밀도 역수)
- **동네 비교**: 우클릭으로 2개 동 비교 (월세/전세/시설 비교 + 왕관 표시)
- **맞춤 필터**: 거래유형·면적·보증금·월세 범위 필터 + 예산·가중치 설정
- **시세 차트**: Recharts 이중 Y축 (보증금 + 월세 추이)
- **지하철·대학교 마커**: 줌 레벨 6 이하에서 SW8·SC4 카테고리 표시
- **반전세 분류**: 한국부동산원 기준 (보증금 > 월세 × 240)
- **모바일 반응형**: 데스크탑 사이드바 + 모바일 바텀시트 (3단계 높이 조절)
- **온보딩 가이드**: 첫 방문 시 5단계 사용법 안내
- **PWA**: 홈 화면 설치 지원

## 🚀 빠른 시작

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에 아래 키 입력:
# VITE_KAKAO_APP_KEY=카카오_JavaScript_앱키
# VITE_DATA_GO_KR_KEY=공공데이터포털_인코딩_서비스키

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 📦 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | React 18 + TypeScript + Vite |
| 스타일 | Tailwind CSS v4 |
| 상태관리 | Zustand |
| 데이터 패칭 | TanStack Query (useQueries 병렬 호출) |
| 지도 | 카카오맵 SDK (동적 스크립트 로딩) |
| 차트 | Recharts (이중 Y축) |
| 배포 | Vercel (Serverless Functions) |

## 🔑 API 키 발급

### 카카오 개발자

1. [developers.kakao.com](https://developers.kakao.com) → 애플리케이션 추가
2. **플랫폼 키** → JavaScript 키 복사
3. **플랫폼** → Web 사이트 도메인 등록 (`http://localhost:5173`, 배포 URL)

### 공공데이터포털

1. [data.go.kr](https://data.go.kr) 회원가입
2. 아래 3개 API 활용 신청:
   - 국토교통부_아파트 전월세 실거래자료
   - 국토교통부_오피스텔 전월세 실거래자료
   - 국토교통부_연립다세대 전월세 실거래자료
3. **인코딩 서비스키** 복사

## 🗂 폴더 구조

```
src/
├── components/
│   ├── chart/          # PriceTrendChart (Recharts 이중 Y축)
│   ├── common/         # Layout, DongDetailPanel, ComparePanel, OnboardingGuide, Toast
│   ├── filter/         # FilterBar, PlaceSearch, PreferencePanel, DualRangeFilter
│   ├── map/            # KakaoMap, KakaoMapProvider, DongOverlay, MapControls, MapPOIOverlay
│   └── score/          # ScoreCard (카카오 Local API 9개 카테고리 검색)
├── constants/          # regionCodes (250개), regionCenters, dongCoords (307개 서울 동)
├── hooks/              # useAllDongClusters, useDongClusters, useRealTransactions
├── services/
│   ├── api.ts          # 국토부 XML 파싱 (dev proxy + Vercel serverless)
│   └── kakaoLocal.ts   # 주변시설 분석 (9개 카테고리 → 5개 점수)
├── stores/             # useAppStore, usePreferenceStore, useToastStore
├── utils/              # geocode, display (반전세 판별), scoreCalc, getVisibleGus
└── types/              # Transaction, DongCluster, kakao.d.ts
api/
└── proxy.js            # Vercel Serverless CORS 프록시 (data.go.kr)
```

## 📊 점수 산출 방식

| 항목 | 기본 가중치 | 데이터 소스 | 방식 |
|---|---|---|---|
| 가격 가성비 | 80 | 국토부 실거래가 | RIR(월세/예산) 기반, 30% 이하 만점 |
| 대중교통 | 70 | 카카오 Local SW8 | 1km 내 지하철역, 최근접 거리 점수화 |
| 치안 | 60 | 카카오 Local PO3 | 2km 내 경찰서/파출소 |
| 편의시설 | 50 | 카카오 Local 6종 | 마트·편의점·병원·카페·은행·세탁소 가중합 |
| 조용한 환경 | 30 | 편의점+카페 밀도 | 밀도 역수 (적을수록 높은 점수) |

사용자가 예산·가중치·자차 여부를 직접 조절할 수 있어요.

## 🌍 Vercel 배포

```bash
npm install -g vercel
vercel

# 환경변수 설정
# VITE_KAKAO_APP_KEY → 카카오 JavaScript 키
# VITE_DATA_GO_KR_KEY → 공공데이터포털 인코딩 키
```

배포 후 카카오 개발자 콘솔에서 배포 도메인을 JavaScript SDK 허용 도메인에 추가하세요.

`vercel.json`에 SPA rewrite + API 라우트 + 정적 자산 캐싱이 설정되어 있어요.

## 🐛 개발 중 발견한 이슈들

1. **XML 태그가 영문**: 공공데이터 API 응답 XML 태그가 문서와 달리 영문 (`dealYear`, `deposit`, `monthlyRent` 등)
2. **resultCode 불일치**: 성공 코드가 `"00"`이 아니라 `"000"`인 경우도 존재
3. **Vite dev proxy 한계**: `npm run dev`에서만 동작 → 프로덕션은 Vercel Serverless(`api/proxy.js`) 사용
4. **카카오맵 스크립트**: `<script>` 태그가 아닌 `document.createElement("script")`로 동적 로딩 필수
5. **Zustand state 직접 정렬 금지**: `visibleGus.sort()` → `[...gus].sort()`로 복사 후 정렬
6. **지오코딩 실패 동**: "종로1가", "보문동6가" 등 → 307개 동 좌표 정적 테이블 + 4단계 폴백

## 📋 향후 개선 사항

- [ ] 행정동 GeoJSON 폴리곤 경계선
- [ ] 지하철 노선 색상 표시
- [ ] 직장 출퇴근 시간/비용 (카카오 Directions API)
- [ ] CCTV·버스 정류장 마커
- [ ] 코드 스플리팅 (Recharts 번들 최적화)
- [ ] 5개 지역 랭킹 대시보드

---

만든이: 이채원 (Sarah) · 2026
