import type { DongCluster } from "@/hooks/useAllDongClusters";

interface Props {
  cluster: DongCluster;
  isSelected: boolean;
  isComparing: boolean;
  onClick: () => void;
  onCompareAdd: () => void;
}

function getBubbleSize(count: number): number {
  if (count >= 100) return 56;
  if (count >= 50) return 48;
  if (count >= 20) return 42;
  if (count >= 10) return 36;
  if (count >= 5) return 32;
  return 28;
}

export default function DongOverlay({
  cluster, isSelected, isComparing, onClick, onCompareAdd,
}: Props) {
  const hasWolse = cluster.wolseCount > cluster.jeonseCount;
  const size = getBubbleSize(cluster.count);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    onCompareAdd();
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onContextMenu={handleContextMenu}
      style={{
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* 비교 중 표시 */}
      {isComparing && (
        <div style={{
          position: "absolute",
          top: "-8px",
          right: "-8px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#f59e0b",
          color: "white",
          fontSize: "10px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          zIndex: 1,
        }}>
          ⚖
        </div>
      )}

      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: isSelected ? "#1d4ed8"
            : isComparing ? "#f59e0b"
            : hasWolse ? "#3b82f6" : "#22c55e",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size >= 48 ? "14px" : size >= 36 ? "13px" : "11px",
          fontWeight: 700,
          boxShadow: isSelected
            ? "0 0 0 3px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.2)"
            : "0 2px 6px rgba(0,0,0,0.15)",
          transition: "all 0.15s ease",
          fontFamily: "Pretendard, sans-serif",
        }}
      >
        {cluster.count}
      </div>
      <div
        style={{
          background: isSelected ? "#1d4ed8"
            : isComparing ? "#f59e0b"
            : "rgba(100, 80, 200, 0.85)",
          color: "white",
          fontSize: "10px",
          fontWeight: 600,
          padding: "2px 6px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          fontFamily: "Pretendard, sans-serif",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {cluster.dongName}
      </div>
    </div>
  );
}
