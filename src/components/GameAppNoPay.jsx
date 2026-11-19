// ✅ GAME-APP (2026-11-20): 방구석 낚시꾼 게임 앱(kr.fishinggo.game) 안에서는 멤버십 결제 화면 대신 안내만 보여 준다.
// 게임 앱 WebView는 사용자 에이전트 끝에 'BangGusukApp/1'을 붙인다(게임 앱 capacitor.config.json appendUserAgent).
// 게임 앱에는 구글 플레이 결제가 아직 없으므로 결제 버튼·다른 결제 경로 안내를 싣지 않는다. 이미 가입한 멤버십 혜택은 같은 계정이라 그대로 적용된다.
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const isGameApp = () => {
  try { return /BangGusukApp\//.test(navigator.userAgent || ''); } catch { return false; }
};

export default function GameAppNoPay() {
  const navigate = useNavigate();
  const back = () => { if ((window.history.state?.idx || 0) > 0) navigate(-1); else navigate('/meta', { replace: true }); };
  return (
    <div style={{ minHeight: '100vh', background: '#0b161d', color: '#e8f1f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', textAlign: 'center' }}>
      <div style={{ fontSize: 'calc(20px * var(--fs,1))', fontWeight: 800, marginBottom: '10px' }}>낚시GO PRO 멤버십</div>
      <div style={{ fontSize: 'calc(16px * var(--fs,1))', lineHeight: 1.7, color: '#b9cbd2', marginBottom: '24px' }}>
        방구석 낚시꾼 앱에서는 멤버십 결제를 제공하지 않습니다.<br />
        이미 가입한 멤버십 혜택은 같은 계정으로 그대로 적용됩니다.
      </div>
      <button type="button" onClick={back} style={{ fontSize: 'calc(17px * var(--fs,1))', fontWeight: 800, padding: '14px 28px', borderRadius: '14px', border: 0, background: '#2fb7a3', color: '#06231f' }}>돌아가기</button>
    </div>
  );
}
