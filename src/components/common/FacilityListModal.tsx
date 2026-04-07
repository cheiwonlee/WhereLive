import type { NearbyPlace } from "@/services/kakaoLocal";

interface Props {
  title: string;
  icon: string;
  places: NearbyPlace[];
  onClose: () => void;
  onPlaceClick?: (place: NearbyPlace) => void;
}

export default function FacilityListModal({
  title, icon, places, onClose, onPlaceClick,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[70vh] rounded-t-2xl sm:rounded-2xl bg-white overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-800">
            {icon} {title} <span className="text-sm text-gray-400">({places.length}개)</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {places.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">주변에 없습니다</div>
          ) : (
            places.map((p, i) => (
              <div
                key={i}
                onClick={() => { onPlaceClick?.(p); onClose(); }}
                className="cursor-pointer border-b border-gray-50 px-5 py-3 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400 truncate">{p.address}</p>
                  </div>
                  <span className="text-xs font-medium text-primary-600 flex-shrink-0">
                    {p.distance}m
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
