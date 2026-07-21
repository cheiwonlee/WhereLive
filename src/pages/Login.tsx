import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, enabled } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setInfo('이메일 인증 링크를 확인해주세요!');
      }
    } catch (err: any) {
      setError(err.message ?? '오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-7 py-16 bg-cream">
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-[11px] tracking-[0.22em] text-sage-500 font-semibold">CLEARPLATE</div>
        <h1 className="display text-[44px] leading-[1.05] text-ink mt-2">
          {mode === 'signin' ? (
            <>돌아오셨네요<span className="text-sage-400">.</span></>
          ) : (
            <>시작해볼까요<span className="text-sage-400">?</span></>
          )}
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-ink/50">
          {mode === 'signin' ? '오늘의 접시를 기록해봐요.' : '이메일로 가입하면 여러 기기에서 동기화돼요.'}
        </p>

        {!enabled && (
          <div className="mt-5 rounded-2xl bg-butter/15 border border-butter/30 p-4 text-[12px] text-ink/70">
            ⚠️ Supabase 설정이 안 되어 있어요. 게스트 모드로만 사용 가능합니다.
          </div>
        )}

        {enabled && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <input
              type="email" required placeholder="이메일"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white rounded-2xl px-5 py-4 text-[14px] border border-black/[0.06] outline-none focus:border-sage-300 transition"
            />
            <input
              type="password" required minLength={6} placeholder="비밀번호 (6자 이상)"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white rounded-2xl px-5 py-4 text-[14px] border border-black/[0.06] outline-none focus:border-sage-300 transition"
            />

            {error && <div className="text-[12px] text-coral bg-coral/10 rounded-xl px-4 py-3">{error}</div>}
            {info && <div className="text-[12px] text-sage-600 bg-sage-50 rounded-xl px-4 py-3">{info}</div>}

            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? '잠시만요…' : mode === 'signin' ? '로그인' : '가입하기'}
            </button>
          </form>
        )}

        {enabled && (
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
            className="mt-5 text-[13px] text-ink/50"
          >
            {mode === 'signin' ? '계정이 없나요? ' : '이미 계정이 있나요? '}
            <span className="text-sage-600 font-semibold">
              {mode === 'signin' ? '가입하기' : '로그인'}
            </span>
          </button>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-ink/10" />
          <span className="text-[10px] text-ink/30 tracking-wider">OR</span>
          <div className="flex-1 h-px bg-ink/10" />
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-white rounded-2xl py-4 text-[14px] font-semibold text-ink/70 border border-black/[0.06] active:scale-[0.99] transition"
        >
          🌱 비회원으로 둘러보기
        </button>
        <p className="mt-3 text-[11px] text-center text-ink/40 leading-relaxed">
          비회원은 이 기기에만 데이터가 저장돼요.<br />
          나중에 가입하면 동기화할 수 있어요.
        </p>
      </div>
    </div>
  );
}
