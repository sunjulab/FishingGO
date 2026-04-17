import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
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
  googleBtn: {
    width: '100%', height: '52px', borderRadius: '16px', border: '1.5px solid #e0e0e0',
    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', color: '#3c4043',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  guestBtn: {
    width: '100%', height: '48px', borderRadius: '14px', border: 'none',
    background: '#f1f5f9', color: '#64748b', fontSize: '14px', fontWeight: '800', cursor: 'pointer'
  },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' },
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
  const [userId, setUserId] = useState('');      // 아이디 (email 필드 사용)
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [idChecked, setIdChecked] = useState(null);   // null=미확인, true=사용가능, false=중복
  const [nameChecked, setNameChecked] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── 구글 로그인 ────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenRes) => {
      try {
        setLoading(true);
        const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenRes.access_token}` }
        });
        if (!infoRes.ok) throw new Error('Google 사용자 정보를 불러올 수 없습니다.');
        const gUser = await infoRes.json();

        const res = await fetch(`${API}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: gUser.email, name: gUser.name, picture: gUser.picture })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '서버 오류');

        onLoginSuccess(data);
      } catch (err) {
        addToast(err.message || '구글 로그인 실패', 'error');
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => {
      console.error('Google OAuth Error:', err);
      addToast('구글 로그인 팝업 오류. 팝업 차단을 해제하거나 잠시 후 다시 시도하세요.', 'error');
    }
  });

  // ─── 로그인/회원가입 성공 공통 처리 ─────────────────────────────────────
  const onLoginSuccess = (data) => {
    setUser(data.user);
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

        {/* 구글 버튼 */}
        <button id="btn-google-login" onClick={() => googleLogin()} disabled={loading} style={S.googleBtn}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google 계정으로 {isLogin ? '로그인' : '간편가입'}
        </button>

        <div style={S.divider}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '700' }}>또는 아이디로</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

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
