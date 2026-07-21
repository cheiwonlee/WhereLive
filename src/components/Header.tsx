import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Props {
  date: Date;
  subtitle?: string;
}

export default function Header({ date, subtitle = 'TODAY' }: Props) {
  return (
    <header className="px-6 pt-12 pb-4 flex items-start justify-between">
      <div>
        <p className="text-[11px] tracking-[0.18em] text-sage-500 font-semibold">{subtitle}</p>
        <h1 className="display text-3xl mt-1 text-ink">
          {format(date, 'MMMM d', { locale: ko })}
          <span className="text-sage-400">.</span>
        </h1>
        <p className="text-xs text-ink/50 mt-1">{format(date, 'yyyy년 EEEE', { locale: ko })}</p>
      </div>
      <div className="flex gap-2">
        <Link to="/settings"><IconBtn><UserIcon /></IconBtn></Link>
        <Link to="/settings"><IconBtn><GearIcon /></IconBtn></Link>
      </div>
    </header>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-10 h-10 rounded-full bg-white border border-black/[0.05] grid place-items-center text-ink/60 active:scale-95 transition">
      {children}
    </button>
  );
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H2a2 2 0 110-4h.1A1.7 1.7 0 003.6 8a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H8a1.7 1.7 0 001-1.5V2a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V8a1.7 1.7 0 001.5 1H22a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  );
}
