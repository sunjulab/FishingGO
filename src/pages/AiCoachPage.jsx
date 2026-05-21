import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Bot, User, MapPin, Fish } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore } from '../store/useUserStore';

const QUICK_QUESTIONS = [
  '오늘 낚시 갈 만한가요?',
  '지금 감성돔 시즌인가요?',
  '갯바위 채비 추천해주세요',
  '찌낚시 미끼 뭐가 좋나요?',
  '물때가 낚시에 어떤 영향을 주나요?',
  '배스 루어 추천해주세요',
];

export default function AiCoachPage() {
  const navigate  = useNavigate();
  const user      = useUserStore(s => s.user);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const [messages, setMessages] = useState([
    { role: 'ai', text: `안녕하세요, ${user?.name || '낚시인'}님! 🎣\n저는 낚시GO AI 코치입니다.\n날씨·물때·어종·채비 무엇이든 물어보세요!`, time: new Date() }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [weather, setWeather]   = useState('');
  const [tide, setTide]         = useState('');

  // 현재 날씨/물때 컨텍스트 자동 수집
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const season = month >= 3 && month <= 5 ? '봄' : month >= 6 && month <= 8 ? '여름' : month >= 9 && month <= 11 ? '가을' : '겨울';
    setWeather(`계절: ${season}`);
    // GPS로 위치 수집
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`)
            .then(r => r.json())
            .then(d => { setLocation(d.address?.city || d.address?.county || d.address?.state || ''); })
            .catch(() => {});
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, time: new Date() }]);
    setLoading(true);
    try {
      const res = await apiClient.post('/api/ai/coach', {
        message: msg,
        context: { location, weather, tide, season: weather },
      }, { timeout: 30000 });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.reply, time: new Date() }]);
    } catch (err) {
      const errMsg = err.response?.status === 503
        ? 'AI 코치 서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.'
        : '오류가 발생했습니다. 다시 시도해주세요.';
      setMessages(prev => [...prev, { role: 'ai', text: errMsg, time: new Date() }]);
    } finally { setLoading(false); }
  };

  const fmtTime = (d) => `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f8fafc' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1628,#0056D2)', padding: '14px 16px',
        paddingTop: 'calc(env(safe-area-inset-top,0px) + 14px)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#4ade80,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
          🤖
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: '900', fontSize: `calc(16px * var(--fs,1))` }}>AI 낚시 코치</div>
          <div style={{ color: '#4ade80', fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700' }}>
            {location ? `📍 ${location} · ` : ''}{weather} · 언제든 물어보세요
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
            {/* 아바타 */}
            {m.role === 'ai' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#4ade80,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                🤖
              </div>
            )}

            {/* 말풍선 */}
            <div style={{ maxWidth: '75%' }}>
              <div style={{
                padding: '12px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' ? '#0056D2' : '#fff',
                color: m.role === 'user' ? '#fff' : '#0d1b2a',
                fontSize: `calc(14px * var(--fs,1))`, lineHeight: '1.5', fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {m.text}
              </div>
              <div style={{ fontSize: `calc(10px * var(--fs,1))`, color: '#94a3b8', marginTop: '3px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {fmtTime(m.time)}
              </div>
            </div>
          </div>
        ))}

        {/* 로딩 */}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#4ade80,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
            <div style={{ background: '#fff', borderRadius: '18px 18px 18px 4px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0056D2', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 빠른 질문 */}
      {messages.length <= 1 && (
        <div style={{ padding: '8px 16px' }}>
          <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: '#94a3b8', fontWeight: '700', marginBottom: '6px' }}>💡 자주 묻는 질문</div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)} style={{
                padding: '8px 14px', borderRadius: '20px', border: '1.5px solid #0056D2',
                background: '#fff', color: '#0056D2', fontWeight: '700', whiteSpace: 'nowrap',
                fontSize: `calc(12px * var(--fs,1))`, cursor: 'pointer', flexShrink: 0,
              }}>{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* 입력창 */}
      <div style={{
        padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 60px)',
        background: '#fff', borderTop: '1px solid #f1f5f9',
        display: 'flex', gap: '10px', alignItems: 'flex-end',
      }}>
        <div style={{ flex: 1, background: '#f8fafc', borderRadius: '24px', border: '1.5px solid #e0e0e0', padding: '10px 16px' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="낚시 관련 무엇이든 물어보세요... 🎣"
            rows={1}
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontSize: `calc(14px * var(--fs,1))`, resize: 'none', fontFamily: 'inherit',
              lineHeight: '1.4', maxHeight: '100px', overflowY: 'auto',
            }}
          />
        </div>
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
          width: '44px', height: '44px', borderRadius: '50%', border: 'none',
          background: (loading || !input.trim()) ? '#e0e0e0' : 'linear-gradient(135deg,#0056D2,#003fa3)',
          color: '#fff', cursor: (loading || !input.trim()) ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,86,210,0.3)',
        }}>
          <Send size={18} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
