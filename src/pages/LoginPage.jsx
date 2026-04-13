import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Anchor, ShieldCheck } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useUserStore(state => state.setUser);
  const addToast = useToastStore(state => state.addToast);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [idChecked, setIdChecked] = useState(false);
  const [nameChecked, setNameChecked] = useState(false);

  const checkId = async () => {
    if (!email) return addToast('아이디를 입력해주세요.', 'error');
    try {
      const res = await fetch(`${API}/api/auth/check-id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.available) { setIdChecked(true); addToast('사용 가능한 아이디입니다.', 'success'); }
      else addToast('이미 사용 중인 아이디입니다.', 'error');
    } catch(err) { addToast('오류가 발생했습니다.', 'error'); }
  };

  const checkName = async () => {
    if (!name) return addToast('닉네임을 입력해주세요.', 'error');
    try {
      const res = await fetch(`${API}/api/auth/check-name`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const data = await res.json();
      if (data.available) { setNameChecked(true); addToast('사용 가능한 닉네임입니다.', 'success'); }
      else addToast('이미 사용 중인 닉네임입니다.', 'error');
    } catch(err) { addToast('오류가 발생했습니다.', 'error'); }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        const res = await fetch(`${API}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: googleUser.email, name: googleUser.name, picture: googleUser.picture })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setUser(data.user);
        localStorage.setItem('token', data.token);
        
        addToast(`환영합니다, ${data.user.name}님!`, 'success');
        if (data.justAttended) setTimeout(() => addToast('🎉 오늘 출석 완료! +15 EXP 획득', 'success'), 1000);
        if (data.leveledUp) setTimeout(() => addToast(`⭐️ 축하합니다! 레벨 ${data.user.level}로 승급하셨습니다!`, 'success'), 2000);
        
        navigate('/');
      } catch (err) {
        addToast('구글 로그인 중 오류가 발생했습니다.', 'error');
      }
    },
    onError: () => addToast('Google Login Failed', 'error')
  });

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      return addToast('모든 정보를 입력해주세요.', 'error');
    }
    if (!isLogin && (!idChecked || !nameChecked)) {
      return addToast('아이디와 닉네임 중복확인을 완료해주세요.', 'error');
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { email, password, name };
      
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '오류가 발생했습니다.');
      }

      if (!isLogin) {
        addToast('회원가입이 완료되었습니다! 로그인해주세요.', 'success');
        setIsLogin(true);
        return;
      }

      // Login Success
      setUser(data.user);
      localStorage.setItem('token', data.token);
      
      addToast(`환영합니다, ${data.user.name}님!`, 'success');
      if (data.justAttended) {
         setTimeout(() => addToast('🎉 오늘 출석 완료! +15 EXP 획득', 'success'), 1000);
      }
      if (data.leveledUp) {
         setTimeout(() => addToast(`⭐️ 축하합니다! 레벨 ${data.user.level}로 승급하셨습니다!`, 'success'), 2000);
      }
      
      navigate('/');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ backgroundColor: '#0056D2', width: '90px', height: '90px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 32px rgba(0, 86, 210, 0.2)' }}>
          <Anchor size={50} color="#fff" />
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#1c1c1e', letterSpacing: '-0.8px' }}>낚시GO</h1>
        <div style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', background: 'linear-gradient(135deg, #FFD700, #FFA500)', borderRadius: '8px', fontSize: '11px', fontWeight: '900', color: '#fff' }}>PREMIUM LOGIN</div>
      </div>

      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => handleGoogleLogin()}
            style={{ 
              width: '100%', height: '56px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '16px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#3c4043', 
              fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Google 간편가입 / 로그인
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '700' }}>또는 아이디로</span>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
          </div>

          {!isLogin && (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" placeholder="아이디 (추후 로그인용)"
                  value={email} onChange={e => { setEmail(e.target.value); setIdChecked(false); }}
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
                />
                <button 
                  onClick={checkId}
                  style={{ padding: '0 16px', borderRadius: '16px', border: '1px solid #0056D2', backgroundColor: idChecked ? '#0056D2' : '#fff', color: idChecked ? '#fff' : '#0056D2', fontWeight: '800' }}>
                  {idChecked ? '사용가' : '중복확인'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" placeholder="닉네임 (중복불가)"
                  value={name} onChange={e => { setName(e.target.value); setNameChecked(false); }}
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
                />
                <button 
                  onClick={checkName}
                  style={{ padding: '0 16px', borderRadius: '16px', border: '1px solid #FF5A5F', backgroundColor: nameChecked ? '#FF5A5F' : '#fff', color: nameChecked ? '#fff' : '#FF5A5F', fontWeight: '800' }}>
                  {nameChecked ? '사용가' : '중복확인'}
                </button>
              </div>
            </>
          )}

          {isLogin && (
            <input 
              type="text" placeholder="아이디"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
            />
          )}
          <input 
            type="password" placeholder="비밀번호"
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
          />
          
          <button 
            onClick={handleAuth}
            style={{ 
              width: '100%', height: '56px', marginTop: '10px',
              backgroundColor: '#1565C0', border: 'none', borderRadius: '16px', 
              color: '#fff', fontSize: '16px', fontWeight: '800', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(21, 101, 192, 0.3)'
            }}>
            {isLogin ? '로그인' : '회원가입'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#888', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </span>
          </div>

          <div style={{ height: '1px', background: '#eee', margin: '20px 0' }} />
          
          <button 
            onClick={() => {
              setUser({ id: 'GUEST', name: '게스트낚시인', email: 'guest@fishinggo.com', level: 1, exp: 0, avatar: 'https://i.pravatar.cc/150?img=11', followers: [] });
              navigate('/');
            }}
            style={{ width: '100%', height: '54px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '16px', color: '#8e8e93', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>
            로그인 없이 둘러보기
          </button>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#bbb', fontSize: '12px', justifyContent: 'center' }}>
            <ShieldCheck size={14} /> 안전한 보안 로그인 적용 중
         </div>
      </div>
    </div>
  );
}
