import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useGoogleLogin } from '@react-oauth/google'; // 추후 구글 로그인 연동 시 활성화
import { Anchor, ShieldCheck, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useUserStore, LEVEL_CONFIG } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── 스타일 상수 ────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100dvh', background: 'linear-gradient(160deg, #0a1628 0%, #0d2a4a 60%, #0056D2 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px'
  },
  card: {
    width: '100%', maxWidth: '360px', background: 'rgba(255,255,255,0.97)',
    borderRadius: '28px', padding: '36px 28px', boxShadow: '0 24px 60px rgba(0,0,0,0.35)'
  },
  input: {
    width: '100%', padding: '14px 16px', borderRadius: '14px', fontSize: '15px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    border: '1.5px solid #e0e0e0', background: '#fafafa', transition: 'border 0.2s'
  },
  row: { display: 'flex', gap: '8px', alignItems: 'stretch' },
  checkBtn: (active) => ({
    flexShrink: 0, padding: '0 14px', borderRadius: '14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer',
    border: `1.5px solid ${active ? '#22c55e' : '#0056D2'}`,
    background: active ? '#22c55e' : '#fff', color: active ? '#fff' : '#0056D2', whiteSpace: 'nowrap'
  }),
  mainBtn: {
    width: '100%', height: '54px', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: '900',
    cursor: 'pointer', background: 'linear-gradient(135deg, #0056D2, #003fa3)',
    color: '#fff', boxShadow: '0 6px 18px rgba(0,86,210,0.4)', transition: 'opacity 0.2s'
  },
  // googleBtn: { /* 추후 구글 로그인 연동 시 복원 */ },
  guestBtn: {
    width: '100%', height: '48px', borderRadius: '14px', border: 'none',
    background: '#f1f5f9', color: '#64748b', fontSize: '14px', fontWeight: '800', cursor: 'pointer'
  },
  tab: (active) => ({
    flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '900',
    fontSize: '15px', background: active ? '#0056D2' : '#f1f5f9', color: active ? '#fff' : '#64748b',
    transition: 'all 0.2s'
  })
};

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useUserStore(state => state.setUser);
  const addToast = useToastStore(state => state.addToast);

  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [idChecked, setIdChecked] = useState(null);   // null=미확인, true=사용가능, false=중복
  const [nameChecked, setNameChecked] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── 구글 로그인 (추후 연동 예정) ──────────────────────────────────────
  // const googleLogin = useGoogleLogin({ ... }); // 연동 시 복원

  // ─── 로그인/회원가입 성공 공통 처리 ─────────────────────────────────────
  const onLoginSuccess = async (data) => {
    const email = data.user?.email;
    let userToSet = data.user;

    // email 기반 별도 저장 아바타 복원 (로그아웃해도 별도 키는 삭제 안 됨)
    try {
      const savedAvatar = email ? localStorage.getItem(`avatar_${email}`) : null;
      const serverAvatar = data.user?.avatar || '';
      const isServerDefault = !serverAvatar || serverAvatar.includes('pravatar.cc');

      if (savedAvatar && savedAvatar.startsWith('data:image') && isServerDefault) {
        // 로컬 저장 사진 → 즉시 반영
        userToSet = { ...data.user, avatar: savedAvatar, picture: savedAvatar };
        // 서버에도 비동기 업로드 (백그라운드)
        fetch(`${API}/api/user/avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, avatar: savedAvatar })
        }).catch(() => {});
      } else if (serverAvatar && !isServerDefault) {
        // 서버 사진이 이미 커스텀이면 별도 키도 갱신
        if (email) localStorage.setItem(`avatar_${email}`, serverAvatar);
      }
    } catch(e) {}

    setUser(userToSet);
    localStorage.setItem('token', data.token);
    addToast(`환영합니다, ${data.user.name}님! 🎣`, 'success');

    if (data.justAttended) {
      setTimeout(() => addToast(`🎉 오늘 출석 완료! +${data.expGained || 20} EXP 획득`, 'success'), 800);
    }
    if (data.leveledUp) {
      const currentLevelIndex = (data.user.level || 1) - 1;
      const levelReward = LEVEL_CONFIG[currentLevelIndex]?.reward || '소정의 찌(포인트)';
      setTimeout(() => {
        addToast(`⭐ 레벨 ${data.user.level} 달성 기념 보상!`, 'success');
        addToast(`🎁 보상: [${levelReward}] 지급 완료!`, 'info');
      }, 1600);
    }
    navigate('/');
  };

  // ─── 아이디 중복확인 ─────────────────────────────────────────────────────
  const checkId = async () => {
    if (!userId.trim()) return addToast('아이디를 입력해주세요.', 'error');
    try {
      const res = await fetch(`${API}/api/auth/check-id`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userId.trim() })
      });
      const data = await res.json();
      setIdChecked(data.available);
      addToast(data.available ? '✅ 사용 가능한 아이디입니다.' : '❌ 이미 사용 중인 아이디입니다.', data.available ? 'success' : 'error');
    } catch { addToast('서버 연결 오류', 'error'); }
  };

  // ─── 닉네임 중복확인 ─────────────────────────────────────────────────────
  const checkName = async () => {
    if (!nickname.trim()) return addToast('닉네임을 입력해주세요.', 'error');
    try {
      const res = await fetch(`${API}/api/auth/check-name`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nickname.trim() })
      });
      const data = await res.json();
      setNameChecked(data.available);
      addToast(data.available ? '✅ 사용 가능한 닉네임입니다.' : '❌ 이미 사용 중인 닉네임입니다.', data.available ? 'success' : 'error');
    } catch { addToast('서버 연결 오류', 'error'); }
  };

  // ─── 회원가입 / 로그인 제출 ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!userId.trim() || !password.trim()) return addToast('아이디와 비밀번호를 입력해주세요.', 'error');
    if (!isLogin) {
      if (!nickname.trim()) return addToast('닉네임을 입력해주세요.', 'error');
      if (!idChecked) return addToast('아이디 중복확인을 완료해주세요.', 'error');
      if (!nameChecked) return addToast('닉네임 중복확인을 완료해주세요.', 'error');
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: userId.trim(), password }
        : { email: userId.trim(), password, name: nickname.trim() };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.');

      if (!isLogin) {
        addToast('🎉 회원가입 완료! 로그인해주세요.', 'success');
        setIsLogin(true);
        setUserId(''); setPassword(''); setNickname('');
        setIdChecked(null); setNameChecked(null);
      } else {
        onLoginSuccess(data);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setUserId(''); setPassword(''); setNickname('');
    setIdChecked(null); setNameChecked(null);
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #0056D2, #003fa3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,86,210,0.35)'
          }}>
            <Anchor size={42} color="#fff" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0d1b2a', margin: 0 }}>낚시GO</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>프리미엄 낚시 커뮤니티 플랫폼</p>
        </div>

        {/* 탭 전환 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button style={S.tab(isLogin)} onClick={() => switchMode()}>로그인</button>
          <button style={S.tab(!isLogin)} onClick={() => switchMode()}>회원가입</button>
        </div>

        {/* 구글 버튼 - 추후 연동 예정 */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 회원가입 시 닉네임 */}
          {!isLogin && (
            <div style={S.row}>
              <input id="input-nickname" style={S.input} type="text" placeholder="닉네임 (앱 표시 이름)"
                value={nickname} onChange={e => { setNickname(e.target.value); setNameChecked(null); }} />
              <button id="btn-check-name" style={S.checkBtn(nameChecked)} onClick={checkName}>
                {nameChecked === true ? <CheckCircle size={16} /> : nameChecked === false ? <XCircle size={16} /> : '중복확인'}
              </button>
            </div>
          )}

          {/* 아이디 */}
          <div style={S.row}>
            <input id="input-userid" style={S.input} type="text" placeholder="아이디"
              value={userId} onChange={e => { setUserId(e.target.value); setIdChecked(null); }} />
            {!isLogin && (
              <button id="btn-check-id" style={S.checkBtn(idChecked)} onClick={checkId}>
                {idChecked === true ? <CheckCircle size={16} /> : idChecked === false ? <XCircle size={16} /> : '중복확인'}
              </button>
            )}
          </div>

          {/* 비밀번호 */}
          <div style={{ position: 'relative' }}>
            <input id="input-password" style={{ ...S.input, paddingRight: '44px' }}
              type={showPass ? 'text' : 'password'} placeholder="비밀번호"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            <button onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0
            }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button id="btn-submit" style={{ ...S.mainBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입 완료'}
          </button>
        </div>

        <div style={{ height: '1px', background: '#e5e7eb', margin: '18px 0' }} />

        <button id="btn-guest" style={S.guestBtn} onClick={() => {
          setUser({ id: 'GUEST', name: '게스트낚시인', email: 'guest@fishinggo.com', level: 1, exp: 0, avatar: 'https://i.pravatar.cc/150?img=11', followers: [] });
          navigate('/');
        }}>
          로그인 없이 둘러보기
        </button>

        <div style={{ textAlign: 'center', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: '#9ca3af', fontSize: '11px' }}>
          <ShieldCheck size={12} /> 보안 암호화 로그인 적용
        </div>
      </div>
    </div>
  );
}
