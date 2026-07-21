import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './hooks/useAuth';
import { useHydrateFromCloud } from './hooks/useSyncedActions';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import AddFood from './pages/AddFood';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import Scanner from './pages/Scanner';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';

export default function App() {
  const gender = useAppStore((s) => s.gender);
  const { loading } = useAuth();

  useHydrateFromCloud();

  if (loading) {
    return (
      <div className="phone grid place-items-center">
        <div className="text-ink/30 text-sm">로딩중…</div>
      </div>
    );
  }

  return (
    <div className="phone">
      {!gender ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Onboarding />} />
        </Routes>
      ) : (
        <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add/:slot" element={<AddFood />} />
            <Route path="/scan/:slot" element={<Scanner />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
        </>
      )}
    </div>
  );
}
