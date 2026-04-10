import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      return addToast('모든 정보를 입력해주세요.', 'error');
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
          {!isLogin && (
            <input 
              type="text" placeholder="닉네임 (중복불가)"
              value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
            />
          )}
          <input 
            type="email" placeholder="이메일"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
          />
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
