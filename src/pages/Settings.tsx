import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppStore, dailyCalorieTarget } from '../store/useAppStore';
import { useSyncedActions } from '../hooks/useSyncedActions';
import { generateNickname } from '../lib/nickname';
import InstallGuide from '../components/InstallGuide';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut, enabled } = useAuth();
  const { gender, nickname, reset } = useAppStore();
  const { setGender, setNickname, deleteAccount } = useSyncedActions();
  const [showInstall, setShowInstall] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickname || '');

  async function handleSignOut() {
    if (signOut) await signOut();
    navigate('/');
  }

  function handleReset() {
    if (confirm('정말 모든 로컬 데이터를 삭제할까요?\n(클라우드 데이터는 유지돼요)')) {
      reset();
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('정말 회원 탈퇴할까요?\n모든 데이터가 영구적으로 삭제되며 복구할 수 없어요.')) return;
    if (!confirm('마지막 확인이에요. 정말로 탈퇴하시겠어요?')) return;
    await deleteAccount();
    navigate('/');
  }

  function handleSaveNickname() {
    const trimmed = tempNickname.trim();
    if (trimmed) {
      setNickname(trimmed);
    }
    setEditingNickname(false);
  }

  function handleRandomNickname() {
    const random = generateNickname();
    setTempNickname(random);
    if (!editingNickname) {
      setNickname(random);
    }
  }

  const displayName = nickname || (user?.email?.split('@')[0]) || '게스트';

  return (
    <div className="pb-32 min-h-screen">
      <div className="px-6 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-black/[0.05] grid place-items-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div>
          <div className="text-[11px] tracking-[0.18em] text-sage-500 font-semibold">SETTINGS</div>
          <h1 className="display text-2xl">설정<span className="text-sage-400">.</span></h1>
        </div>
      </div>

      {/* Profile */}
      <div className="px-6 mt-2">
        <div className="card">
          <div className="text-[11px] tracking-wider text-ink/40 font-semibold mb-3">PROFILE</div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-sage-100 grid place-items-center shrink-0">
              <span className="display text-2xl text-sage-600">{displayName[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              {editingNickname ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempNickname}
                    onChange={(e) => setTempNickname(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                    autoFocus
                    placeholder="닉네임을 입력하세요"
                    className="flex-1 min-w-0 bg-cream rounded-lg px-3 py-2 text-[14px] outline-none border border-sage-200"
                  />
                  <button onClick={handleSaveNickname} className="text-[12px] font-semibold text-sage-600 px-2">저장</button>
                </div>
              ) : (
                <div>
                  <div className="text-[15px] font-bold truncate">{displayName}</div>
                  {user?.email && <div className="text-[11px] text-ink/40 truncate">{user.email}</div>}
                  {!user && <div className="text-[11px] text-ink/40">게스트 모드</div>}
                </div>
              )}
            </div>
          </div>

          {/* Nickname controls */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setTempNickname(nickname || ''); setEditingNickname(true); }}
              className="flex-1 bg-cream rounded-xl py-2.5 text-[12px] font-semibold text-ink/70 active:scale-[0.98] transition"
            >
              ✏️ 닉네임 변경
            </button>
            <button
              onClick={handleRandomNickname}
              className="flex-1 bg-sage-50 rounded-xl py-2.5 text-[12px] font-semibold text-sage-600 active:scale-[0.98] transition"
            >
              🎲 랜덤 생성
            </button>
          </div>
        </div>
      </div>

      {/* Login button (if not logged in) */}
      {enabled && !user && (
        <div className="px-6 mt-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full card text-left active:scale-[0.99] transition flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] tracking-wider text-ink/40 font-semibold mb-1">ACCOUNT</div>
              <div className="display text-lg">로그인하기</div>
              <p className="text-[11px] text-ink/50 mt-0.5">여러 기기에서 데이터를 동기화할 수 있어요</p>
            </div>
            <span className="text-2xl">🔑</span>
          </button>
        </div>
      )}

      {/* Gender */}
      <div className="px-6 mt-3">
        <div className="card">
          <div className="text-[11px] tracking-wider text-ink/40 font-semibold mb-3">성별 / 권장 칼로리</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setGender('female')}
              className={`rounded-2xl p-3 text-left border transition ${
                gender === 'female' ? 'bg-ink text-cream border-ink' : 'bg-white border-black/[0.06]'
              }`}
            >
              <div className={`text-[10px] ${gender === 'female' ? 'text-cream/60' : 'text-ink/40'}`}>FEMALE</div>
              <div className="display text-base">여성</div>
              <div className={`display text-lg ${gender === 'female' ? 'text-sage-300' : 'text-sage-500'}`}>2,000</div>
            </button>
            <button
              onClick={() => setGender('male')}
              className={`rounded-2xl p-3 text-left border transition ${
                gender === 'male' ? 'bg-ink text-cream border-ink' : 'bg-white border-black/[0.06]'
              }`}
            >
              <div className={`text-[10px] ${gender === 'male' ? 'text-cream/60' : 'text-ink/40'}`}>MALE</div>
              <div className="display text-base">남성</div>
              <div className={`display text-lg ${gender === 'male' ? 'text-sage-300' : 'text-sage-500'}`}>2,600</div>
            </button>
          </div>
          <div className="text-[10px] text-ink/40 mt-2">
            현재 설정: 일일 {dailyCalorieTarget(gender).toLocaleString()} kcal
          </div>
        </div>
      </div>

      {/* Install */}
      <div className="px-6 mt-3">
        <button onClick={() => setShowInstall(true)} className="w-full card text-left active:scale-[0.99] transition">
          <div className="text-[11px] tracking-wider text-ink/40 font-semibold mb-2">INSTALL</div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="display text-lg">앱처럼 설치하기</div>
              <p className="text-[12px] text-ink/50 mt-0.5">홈 화면에 추가해서 빠르게 열어보세요</p>
            </div>
            <div className="text-2xl">📲</div>
          </div>
        </button>
      </div>

      {/* About */}
      <div className="px-6 mt-3">
        <div className="card">
          <div className="text-[11px] tracking-wider text-ink/40 font-semibold mb-2">ABOUT</div>
          <div className="display text-xl">ClearPlate</div>
          <p className="text-[12px] text-ink/50 mt-1 leading-relaxed">
            매일 먹는 식사 접시(Plate)에서 해로운 영양소를 깨끗하게(Clear) 비워내자는
            의미를 담은 위해가능영양소 추적 앱.
          </p>
          <div className="text-[10px] text-ink/30 mt-3">v0.3 · 2026</div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="px-6 mt-6 space-y-2">
        <button
          onClick={handleReset}
          className="w-full bg-white rounded-2xl py-4 text-[13px] text-ink/60 border border-black/[0.06] active:scale-[0.99] transition"
        >
          로컬 데이터 초기화
        </button>
        {enabled && user && (
          <>
            <button
              onClick={handleSignOut}
              className="w-full bg-white rounded-2xl py-4 text-[13px] text-ink/60 border border-black/[0.06] active:scale-[0.99] transition"
            >
              로그아웃
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-coral/10 rounded-2xl py-4 text-[13px] text-coral font-semibold active:scale-[0.99] transition"
            >
              회원 탈퇴
            </button>
          </>
        )}
      </div>

      <InstallGuide open={showInstall} onClose={() => setShowInstall(false)} />
    </div>
  );
}
