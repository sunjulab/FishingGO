import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, ShieldCheck, Eye, EyeOff, CheckCircle, XCircle, User, Phone, Search, KeyRound, X } from 'lucide-react';
import { useUserStore, LEVEL_CONFIG } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';

const GUEST_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E8F2FF'/%3E%3Ccircle cx='50' cy='36' r='19' fill='%230056D2' opacity='.75'/%3E%3Cellipse cx='50' cy='88' rx='30' ry='22' fill='%230056D2' opacity='.55'/%3E%3C/svg%3E";

// ─── 아이디 찾기 / 비밀번호 찾기 모달 ─────────────────────────────────────
function FindAccountModal({ mode, onClose }) {
  const addToast = useToastStore(s => s.addToast);
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    let f = digits;
    if (digits.length >= 4 && digits.length <= 7) f = `${digits.slice(0,3)}-${digits.slice(3)}`;
    else if (digits.length > 7) f = `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
    setPhone(f);
  };

  const handleFindId = async () => {
    if (!realName.trim()) return addToast('이름을 입력해주세요.', 'error');
    if (!phone.trim()) return addToast('전화번호를 입력해주세요.', 'error');
    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/find-id', {
        realName: realName.trim(),
        phone: phone.replace(/[^0-9]/g, ''),
      });
      setResult(res.data.email);
    } catch (err) {
      addToast(err.response?.data?.error || '일치하는 회원 정보가 없습니다.', 'error');
    } finally { setLoading(false); }
  };

  const handleResetPw = async () => {
    if (!realName.trim()) return addToast('이름을 입력해주세요.', 'error');
    if (!phone.trim()) return addToast('전화번호를 입력해주세요.', 'error');
    if (newPass.length < 8) return addToast('새 비밀번호는 8자 이상이어야 합니다.', 'error');
    setLoading(true);
    try {
      await apiClient.post('/api/auth/reset-password', {
        realName: realName.trim(),
        phone: phone.replace(/[^0-9]/g, ''),
        newPassword: newPass,
      });
      addToast('✅ 비밀번호가 변경되었습니다. 로그인해주세요.', 'success');
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || '일치하는 회원 정보가 없습니다.', 'error');
    } finally { setLoading(false); }
  };

  const isFindId = mode === 'findId';
  const inputSt = {
    width: '100%', padding: '13px 16px 13px 42px', borderRadius: '12px',
    fontSize: `calc(14px * var(--fs, 1))`, border: '1.5px solid #e0e0e0',
    background: '#fafafa', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '340px', background: '#fff',
        borderRadius: '24px', padding: '28px 22px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: isFindId ? 'linear-gradient(135deg,#0056D2,#003fa3)' : 'linear-gradient(135deg,#00875A,#005c3c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isFindId ? <Search size={18} color="#fff" /> : <KeyRound size={18} color="#fff" />}
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: `calc(16px * var(--fs, 1))`, color: '#0d1b2a' }}>
                {isFindId ? '아이디 찾기' : '비밀번호 찾기'}
              </div>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#94a3b8' }}>
                가입 시 등록한 이름 + 전화번호로 확인
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
            <X size={22} />
          </button>
        </div>

        {/* 결과 화면 */}
        {result ? (
          <div style={{
            background: 'linear-gradient(135deg,#EBF5FF,#F0FFF8)', borderRadius: '16px',
            padding: '24px', textAlign: 'center', border: '1.5px solid #D0E4FF',
          }}>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#64748b', marginBottom: '8px' }}>
              🎣 찾은 아이디
            </div>
            <div style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '900', color: '#0056D2', letterSpacing: '0.02em' }}>
              {result}
            </div>
            <button onClick={onClose} style={{
              marginTop: '18px', width: '100%', padding: '13px', borderRadius: '12px',
              border: 'none', background: 'linear-gradient(135deg,#0056D2,#003fa3)', color: '#fff',
              fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer',
            }}>
              로그인하러 가기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 이름 */}
            <div>
              <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>실명 (가입 시 등록한 이름)</span>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input style={inputSt} type="text" placeholder="홍길동"
                  value={realName} onChange={e => setRealName(e.target.value)} />
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>전화번호</span>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input style={inputSt} type="tel" placeholder="010-XXXX-XXXX"
                  value={phone} onChange={handlePhoneChange} />
              </div>
            </div>

            {/* 새 비밀번호 (비번 찾기 전용) */}
            {!isFindId && (
              <div>
                <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>새 비밀번호 (8자 이상)</span>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input style={{ ...inputSt, paddingRight: '44px' }}
                    type={showNewPass ? 'text' : 'password'} placeholder="새 비밀번호 입력"
                    value={newPass} onChange={e => setNewPass(e.target.value)} />
                  <button onClick={() => setShowNewPass(!showNewPass)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0,
                  }}>
                    {showNewPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            )}

            {/* 확인 버튼 */}
            <button
              onClick={isFindId ? handleFindId : handleResetPw}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: isFindId
                  ? 'linear-gradient(135deg,#0056D2,#003fa3)'
                  : 'linear-gradient(135deg,#00875A,#005c3c)',
                color: '#fff', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '900',
                cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px',
                boxShadow: isFindId ? '0 6px 18px rgba(0,86,210,0.3)' : '0 6px 18px rgba(0,135,90,0.3)',
              }}
            >
              {loading ? '확인 중...' : isFindId ? '🔍 아이디 찾기' : '🔑 비밀번호 변경'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useUserStore(state => state.setUser);
  const addToast = useToastStore(state => state.addToast);
  const timerRef = useRef(null);
  const levelTimerRef = useRef(null);

  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [idChecked, setIdChecked] = useState(null);
  const [nameChecked, setNameChecked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [findModal, setFindModal] = useState(null); // null | 'findId' | 'findPw'

  const onLoginSuccess = async (data) => {
    const email = data.user?.email;
    let userToSet = data.user;
    const accessToken = data.accessToken || data.token;
    if (accessToken) {
      try { localStorage.setItem('access_token', accessToken); } catch { /* StorageError 무시 */ }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    if (data.refreshToken) { try { localStorage.setItem('refresh_token', data.refreshToken); } catch { /* StorageError 무시 */ } }
    try {
      const savedAvatar = email ? localStorage.getItem(`avatar_${email}`) : null;
      const serverAvatar = data.user?.avatar || '';
      const isServerDefault = !serverAvatar || serverAvatar.includes('pravatar.cc');
      if (savedAvatar && savedAvatar.startsWith('data:image') && isServerDefault) {
        userToSet = { ...data.user, avatar: savedAvatar, picture: savedAvatar };
        apiClient.post('/api/user/avatar', { email, avatar: savedAvatar }).catch((err) => {
          if (!import.meta.env.PROD) console.warn('[Login] 아바타 서버 업로드 실패:', err?.message);
        });
      } else if (serverAvatar && !isServerDefault) {
        if (email) localStorage.setItem(`avatar_${email}`, serverAvatar);
      }
    } catch(e) { if (!import.meta.env.PROD) console.warn('[Login] 아바타 복원 실패:', e); }
    setUser(userToSet);
    addToast(`환영합니다, ${data.user.name}님! 🎣`, 'success');
    if (data.justAttended) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => addToast(`🎉 오늘 출석 완료! +${data.expGained || 20} EXP 획득`, 'success'), 800);
    }
    if (data.leveledUp) {
      const currentLevelIndex = (data.user.level || 1) - 1;
      const levelReward = LEVEL_CONFIG[currentLevelIndex]?.reward || '소정의 찌(포인트)';
      if (levelTimerRef.current) clearTimeout(levelTimerRef.current);
      levelTimerRef.current = setTimeout(() => {
        addToast(`⭐ 레벨 ${data.user.level} 달성 기념 보상!`, 'success');
        addToast(`🎁 보상: [${levelReward}] 지급 완료!`, 'info');
      }, 1600);
    }
    navigate('/');
  };

  const checkId = async () => {
    if (!userId.trim()) return addToast('아이디를 입력해주세요.', 'error');
    try {
      const res = await apiClient.post('/api/auth/check-id', { email: userId.trim() });
      setIdChecked(res.data.available);
      if (res.data.banned) { addToast(`❌ ${res.data.error}`, 'error'); }
      else { addToast(res.data.available ? '✅ 사용 가능한 아이디입니다.' : '❌ 이미 사용 중인 아이디입니다.', res.data.available ? 'success' : 'error'); }
    } catch { addToast('서버 연결 오류', 'error'); }
  };

  const checkName = async () => {
    if (!nickname.trim()) return addToast('닉네임을 입력해주세요.', 'error');
    try {
      const res = await apiClient.post('/api/auth/check-name', { name: nickname.trim() });
      setNameChecked(res.data.available);
      if (res.data.banned) { addToast(`❌ ${res.data.error}`, 'error'); }
      else { addToast(res.data.available ? '✅ 사용 가능한 닉네임입니다.' : '❌ 이미 사용 중인 닉네임입니다.', res.data.available ? 'success' : 'error'); }
    } catch { addToast('서버 연결 오류', 'error'); }
  };

  const handleLogin = async (isRetry = false) => {
    setLoading(true);
    let retrying = false;
    try {
      const res = await apiClient.post('/api/auth/login', { email: userId.trim(), password });
      onLoginSuccess(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || '오류가 발생했습니다.';
      if (status === 503 && !isRetry) {
        addToast('⏳ 서버가 초기화 중입니다. 잠시 후 자동 재시도...', 'info');
        retrying = true;
        setTimeout(() => handleLogin(true), 3000);
        return;
      }
      addToast(msg, 'error');
    } finally { if (!retrying) setLoading(false); }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/auth/register', {
        email: userId.trim(), password, name: nickname.trim(),
        realName: realName.trim(), phone: phone.replace(/[^0-9]/g, ''),
      });
      addToast('🎉 회원가입 완료! 로그인해주세요.', 'success');
      setIsLogin(true);
      setUserId(''); setPassword(''); setNickname(''); setRealName(''); setPhone('');
      setIdChecked(null); setNameChecked(null);
    } catch (err) {
      addToast(err.response?.data?.error || err.message || '오류가 발생했습니다.', 'error');
    } finally { setLoading(false); }
  };

  const handleSubmit = () => {
    if (!userId.trim() || !password.trim()) return addToast('아이디와 비밀번호를 입력해주세요.', 'error');
    if (!isLogin) {
      if (!nickname.trim()) return addToast('닉네임을 입력해주세요.', 'error');
      if (!realName.trim()) return addToast('이름을 입력해주세요.', 'error');
      if (realName.trim().length < 2) return addToast('이름은 2자 이상이어야 합니다.', 'error');
      const phoneDigits = phone.replace(/[^0-9]/g, '');
      if (!phoneDigits) return addToast('전화번호를 입력해주세요.', 'error');
      if (!/^01[016789]\d{7,8}$/.test(phoneDigits)) return addToast('유효한 휴대폰 번호를 입력해주세요. (010-XXXX-XXXX)', 'error');
      if (password.length < 8) return addToast('비밀번호는 8자 이상이어야 합니다.', 'error');
      if (idChecked === null) return addToast('아이디 중복확인을 완료해주세요.', 'error');
      if (idChecked === false) return addToast('이미 사용 중인 아이디입니다.', 'error');
      if (nameChecked === null) return addToast('닉네임 중복확인을 완료해주세요.', 'error');
      if (nameChecked === false) return addToast('이미 사용 중인 닉네임입니다.', 'error');
      return handleRegister();
    }
    return handleLogin();
  };

  const switchMode = () => {
    setIsLogin(prev => !prev);
    setUserId(''); setPassword(''); setNickname(''); setRealName(''); setPhone('');
    setShowPass(false); setIdChecked(null); setNameChecked(null);
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
      { label: '약함', color: '#FF3B30' }, { label: '보통', color: '#FF9500' },
      { label: '강함', color: '#34C759' }, { label: '매우 강함', color: '#0056D2' },
    ];
    return { lvl: levels[Math.min(score - 1, 3)] || levels[0], width: `${Math.max(25, (score / 4) * 100)}%` };
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length >= 4 && digits.length <= 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    else if (digits.length > 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    setPhone(formatted);
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: '12px', fontSize: `calc(15px * var(--fs, 1))`,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    border: '1.5px solid #e0e0e0', background: '#fafafa', transition: 'border 0.2s',
  };
  const checkBtnStyle = (active) => ({
    flexShrink: 0, padding: '0 14px', borderRadius: '12px', fontWeight: '800',
    fontSize: `calc(13px * var(--fs, 1))`, cursor: 'pointer', height: '46px',
    border: `1.5px solid ${active === true ? '#22c55e' : active === false ? '#FF3B30' : '#0056D2'}`,
    background: active === true ? '#22c55e' : active === false ? '#FF3B30' : '#fff',
    color: active === true ? '#fff' : active === false ? '#fff' : '#0056D2', whiteSpace: 'nowrap',
  });
  const labelStyle = {
    fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block',
  };

  return (
    <>
      {findModal && <FindAccountModal mode={findModal} onClose={() => setFindModal(null)} />}

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(160deg, #0a1628 0%, #0d2a4a 60%, #0056D2 100%)' }} />

      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100dvh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%', maxWidth: '360px', background: 'rgba(255,255,255,0.97)',
          borderRadius: '28px', padding: '28px 22px', boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          marginTop: 'auto', marginBottom: 'auto',
        }}>
          {/* 로고 */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{
              width: '68px', height: '68px', borderRadius: '20px', margin: '0 auto 10px',
              background: 'linear-gradient(135deg, #0056D2, #003fa3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,86,210,0.35)',
            }}>
              <Anchor size={34} color="#fff" />
            </div>
            <h1 style={{ fontSize: `calc(24px * var(--fs, 1))`, fontWeight: '900', color: '#0d1b2a', margin: 0 }}>낚시GO</h1>
            <p style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#64748b', marginTop: '2px' }}>프리미엄 낚시 커뮤니티 플랫폼</p>
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
            <button style={{
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: '900', fontSize: `calc(14px * var(--fs, 1))`,
              background: isLogin ? '#0056D2' : '#f1f5f9', color: isLogin ? '#fff' : '#64748b', transition: 'all 0.2s',
            }} onClick={() => { if (!isLogin) switchMode(); }}>로그인</button>
            <button style={{
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: '900', fontSize: `calc(14px * var(--fs, 1))`,
              background: !isLogin ? '#0056D2' : '#f1f5f9', color: !isLogin ? '#fff' : '#64748b', transition: 'all 0.2s',
            }} onClick={() => { if (isLogin) switchMode(); }}>회원가입</button>
          </div>

          {/* 폼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {!isLogin && (
              <div>
                <span style={labelStyle}>닉네임</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input id="input-nickname" style={inputStyle} type="text" placeholder="앱 표시 이름"
                    value={nickname} onChange={e => { setNickname(e.target.value); setNameChecked(null); }} />
                  <button id="btn-check-name" style={checkBtnStyle(nameChecked)} onClick={checkName} disabled={loading}>
                    {nameChecked === true ? <CheckCircle size={16} /> : nameChecked === false ? <XCircle size={16} /> : '중복확인'}
                  </button>
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <span style={labelStyle}>실명</span>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input id="input-realname" style={{ ...inputStyle, paddingLeft: '40px' }} type="text"
                    placeholder="홍길동" maxLength={20} value={realName} onChange={e => setRealName(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <span style={labelStyle}>아이디</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input id="input-userid" style={inputStyle} type="text" placeholder="아이디를 입력하세요"
                  value={userId} onChange={e => { setUserId(e.target.value); setIdChecked(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                {!isLogin && (
                  <button id="btn-check-id" style={checkBtnStyle(idChecked)} onClick={checkId} disabled={loading}>
                    {idChecked === true ? <CheckCircle size={16} /> : idChecked === false ? <XCircle size={16} /> : '중복확인'}
                  </button>
                )}
              </div>
            </div>

            {!isLogin && (
              <div>
                <span style={labelStyle}>전화번호</span>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input id="input-phone" style={{ ...inputStyle, paddingLeft: '40px' }} type="tel"
                    placeholder="010-XXXX-XXXX" value={phone} onChange={handlePhoneChange} />
                </div>
              </div>
            )}

            <div>
              <span style={labelStyle}>비밀번호{!isLogin && ' (8자 이상)'}</span>
              <div style={{ position: 'relative' }}>
                <input id="input-password" style={{ ...inputStyle, paddingRight: '44px' }}
                  type={showPass ? 'text' : 'password'} placeholder="비밀번호를 입력하세요"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                <button onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0,
                }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!isLogin && password.length > 0 && (() => {
                const { lvl, width } = getPasswordStrength();
                return (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ height: '4px', borderRadius: '4px', background: '#f0f0f0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width, background: lvl.color, borderRadius: '4px', transition: 'width 0.3s, background 0.3s' }} />
                    </div>
                    <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: lvl.color, fontWeight: '800', marginTop: '3px', textAlign: 'right' }}>
                      비밀번호 강도: {lvl.label}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ✅ 아이디 찾기 / 비밀번호 찾기 (로그인 탭 전용) */}
            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '2px' }}>
                <button id="btn-find-id" onClick={() => setFindModal('findId')} style={{
                  background: 'none', border: 'none', color: '#0056D2',
                  fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline',
                }}>아이디 찾기</button>
                <button id="btn-find-pw" onClick={() => setFindModal('findPw')} style={{
                  background: 'none', border: 'none', color: '#0056D2',
                  fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline',
                }}>비밀번호 찾기</button>
              </div>
            )}

            <button id="btn-submit" style={{
              width: '100%', height: '52px', borderRadius: '14px', border: 'none',
              fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer',
              background: 'linear-gradient(135deg, #0056D2, #003fa3)', color: '#fff',
              boxShadow: '0 6px 18px rgba(0,86,210,0.4)', transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1, marginTop: '4px',
            }} onClick={handleSubmit} disabled={loading}>
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입 완료'}
            </button>
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }} />

          <button id="btn-guest" style={{
            width: '100%', height: '46px', borderRadius: '12px', border: 'none',
            background: '#f1f5f9', color: '#64748b', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer',
          }} onClick={() => {
            setUser({ id: 'GUEST', name: '게스트낚시인', email: '', tier: 'FREE', level: 1, exp: 0, totalExp: 0, avatar: GUEST_AVATAR, followers: [] });
            navigate('/');
          }}>
            로그인 없이 둘러보기
          </button>

          <div style={{ textAlign: 'center', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center', color: '#9ca3af', fontSize: `calc(11px * var(--fs, 1))` }}>
            <ShieldCheck size={12} /> 보안 암호화 로그인 적용
          </div>
        </div>
      </div>
    </>
  );
}
