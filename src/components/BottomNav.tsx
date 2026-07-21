import { NavLink } from 'react-router-dom';

const items = [
  { to: '/dashboard', label: '리포트', icon: ChartIcon },
  { to: '/', label: '홈', icon: HomeIcon },
  { to: '/articles', label: '읽을거리', icon: BookIcon },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-cream/90 backdrop-blur-lg border-t border-black/[0.06]">
      <div className="grid grid-cols-3 px-4 pt-3 pb-6">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] tracking-tight transition ${
                isActive ? 'text-ink' : 'text-ink/40'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8.5z" strokeLinejoin="round" />
    </svg>
  );
}
function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
    </svg>
  );
}
function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" strokeLinejoin="round" />
      <path d="M4 19a2 2 0 002 2h13" />
    </svg>
  );
}
