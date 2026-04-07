import { useAppStore } from "@/stores/useAppStore";
import { toast } from "@/stores/useToastStore";

export default function MapControls() {
  const { map, setMapLevel, setMapCenter } = useAppStore();

  function handleLocation() {
    if (!navigator.geolocation) {
      toast.error("이 브라우저에서는 위치 정보를 사용할 수 없습니다");
      return;
    }
    toast.info("현재 위치를 가져오는 중...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMapLevel(4);
        toast.success("현재 위치로 이동");
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            setMapCenter({ lat: pos2.coords.latitude, lng: pos2.coords.longitude });
            setMapLevel(4);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000 }
        );
      },
      () => toast.error("위치 정보를 가져올 수 없습니다. 브라우저 권한을 확인해주세요"),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }

  return (
    <div className="absolute bottom-6 right-3 z-10 flex flex-col items-end gap-2">
      {/* 범례 */}
      <div className="rounded-lg bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
          <span className="text-[10px] text-gray-600 whitespace-nowrap">월세 비중 높음</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-[10px] text-gray-600 whitespace-nowrap">전세 비중 높음</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span className="text-[10px] text-gray-600 whitespace-nowrap">비교 중</span>
        </div>
      </div>

      <button onClick={handleLocation}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md hover:bg-gray-50 active:bg-gray-100" title="현재 위치">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
          <circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>

      <div className="flex flex-col rounded-lg bg-white shadow-md overflow-hidden">
        <button onClick={() => setMapLevel(Math.max(1, map.level - 1))}
          className="flex h-10 w-10 items-center justify-center border-b border-gray-100 text-lg font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100">+</button>
        <button onClick={() => setMapLevel(Math.min(14, map.level + 1))}
          className="flex h-10 w-10 items-center justify-center text-lg font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100">−</button>
      </div>
    </div>
  );
}
