import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {jwtDecode} from 'jwt-decode';
import { Anchor, ShieldCheck } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google login success:', tokenResponse);
      
      try {
        // 실제로는 access_token을 가지고 구글 API를 호출하여 유저 정보를 가져옵니다.
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        
        const googleUser = await userInfoRes.json();
        console.log('Google User Info:', googleUser);

        // 백엔드에 자동 가입 요청
        const response = await fetch(`${API}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture
          })
        });

        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          alert(`${userData.name}님, 구글 계정으로 가입 및 로그인이 완료되었습니다!`);
          navigate('/');
        } else {
          throw new Error('Backend login failed');
        }
      } catch (err) {
        console.error('Auth error:', err);
        alert('로그인 처리 중 오류가 발생했습니다.');
      }
    },
    onError: (error) => console.log('Login Failed:', error)
  });

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <div style={{ backgroundColor: '#0056D2', width: '90px', height: '90px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 32px rgba(0, 86, 210, 0.2)' }}>
          <Anchor size={50} color="#fff" />
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#1c1c1e', letterSpacing: '-0.8px' }}>낚시GO</h1>
        <div style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', background: 'linear-gradient(135deg, #FFD700, #FFA500)', borderRadius: '8px', fontSize: '11px', fontWeight: '900', color: '#fff' }}>PREMIUM FISHING GUIDE</div>
        <p style={{ marginTop: '20px', fontSize: '16px', color: '#8e8e93', lineHeight: '1.6' }}>
          실시간 입질 알림부터 나만의 조과 다이어리까지,<br />가장 스마트한 낚시 생활을 즐겨보세요.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 구글 로그인 버튼 */}
          <button 
            onClick={() => handleGoogleLogin()}
            style={{ 
              width: '100%', 
              height: '58px', 
              backgroundColor: '#fff', 
              border: '1px solid #e0e0e0', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px', 
              color: '#3c4043', 
              fontSize: '16px', 
              fontWeight: '700', 
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Google 계정으로 시작하기
          </button>

          {/* 개발용 게스트 로그인 버튼 */}
          <button 
            onClick={() => {
              const demoUser = { id: 'GUEST', name: '게스트낚시인', email: 'guest@fishinggo.com', level: 1, points: '0', followers: 0, records: 0, picture: 'https://i.pravatar.cc/150?img=11' };
              localStorage.setItem('user', JSON.stringify(demoUser));
              navigate('/');
            }}
            style={{ 
              width: '100%', height: '58px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '20px', 
              color: '#8e8e93', fontSize: '15px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            로그인 없이 둘러보기 (GUEST)
          </button>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#bbb', fontSize: '13px', justifyContent: 'center' }}>
            <ShieldCheck size={14} /> 보안 로그인 적용 중
         </div>
      </div>

      <div style={{ position: 'absolute', bottom: '50px', textAlign: 'center', width: '100%', padding: '0 24px' }}>
         <p style={{ fontSize: '11px', color: '#bbb', lineHeight: '1.7', letterSpacing: '-0.2px' }}>
            로그인 시 낚시GO의 <span style={{ textDecoration: 'underline', color: '#8e8e93' }}>이용약관</span> 및 <span style={{ textDecoration: 'underline', color: '#8e8e93' }}>개인정보 처리방침</span>에<br />동의하는 것으로 간주됩니다.
         </p>
         <p style={{ fontSize: '10px', color: '#ddd', marginTop: '10px' }}>
            * 테스트를 위해 실제 구글 클라이언트 ID가 필요합니다.
         </p>
      </div>
    </div>
  );
}
