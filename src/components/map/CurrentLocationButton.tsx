import { useAppStore } from "@/stores/useAppStore";

export default function CurrentLocationButton() {
  const { setMapCenter, setMapLevel } = useAppStore();

  function handleClick() {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMapLevel(3);
      },
      () => alert("위치 정보를 가져올 수 없습니다."),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-24 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
      title="현재 위치"
    >
      {/* 크로스헤어 아이콘 */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
    </button>
  );
}
