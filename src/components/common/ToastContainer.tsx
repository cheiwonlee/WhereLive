import { useToastStore } from "@/stores/useToastStore";

export default function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-full px-5 py-2.5 text-sm font-medium shadow-lg backdrop-blur-sm animate-[slideUp_0.2s_ease-out] ${
            t.type === "success"
              ? "bg-green-500/90 text-white"
              : t.type === "error"
              ? "bg-red-500/90 text-white"
              : "bg-gray-800/90 text-white"
          }`}
        >
          {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : ""}
          {t.message}
        </div>
      ))}
    </div>
  );
}
