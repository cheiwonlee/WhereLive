import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default function KakaoMapProvider({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const appKey = import.meta.env.VITE_KAKAO_APP_KEY;

    // 디버그 로그
    console.log("[어디살지] 앱키 존재:", !!appKey);
    console.log("[어디살지] 앱키 앞 4자리:", appKey ? appKey.slice(0, 4) + "..." : "없음");

    if (!appKey) {
      setError(
        ".env 파일에 VITE_KAKAO_APP_KEY가 없습니다.\n" +
        "1. 프로젝트 루트에 .env 파일 생성\n" +
        "2. VITE_KAKAO_APP_KEY=카카오_JavaScript_키 입력\n" +
        "3. dev 서버 재시작 (Ctrl+C → npm run dev)"
      );
      return;
    }

    // 이미 로드됐으면 스킵
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => setReady(true));
      return;
    }

    // 동적으로 카카오맵 스크립트 삽입
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      console.log("[어디살지] 스크립트 로드 완료, kakao.maps.load() 호출");
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          console.log("[어디살지] 카카오맵 초기화 성공!");
          setReady(true);
        });
      } else {
        setError("카카오 스크립트는 로드됐지만 maps 객체가 없습니다. 앱키를 확인하세요.");
      }
    };

    script.onerror = () => {
      console.error("[어디살지] 카카오맵 스크립트 로드 실패");
      setError("카카오맵 스크립트 로드 실패. 네트워크 연결을 확인하세요.");
    };

    document.head.appendChild(script);

    return () => {
      // cleanup: 중복 삽입 방지
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="max-w-md px-4 text-center">
          <p className="text-lg font-semibold text-red-600">
            카카오맵 로드 실패
          </p>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-100 p-4 text-left text-xs text-gray-600">
            {error}
          </pre>
          <p className="mt-4 text-xs text-gray-400">
            F12 → Console 탭에서 자세한 로그를 확인하세요
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-sm text-gray-500">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
