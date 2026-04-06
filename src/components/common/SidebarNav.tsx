import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", label: "검색", icon: "🔍" },
  { path: "/compare", label: "비교", icon: "⚖️" },
  { path: "/budget", label: "예산", icon: "💰" },
] as const;

export default function SidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="flex border-b border-gray-100">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
            isActive(tab.path)
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
