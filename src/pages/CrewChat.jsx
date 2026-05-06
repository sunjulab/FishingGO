import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ChevronLeft, Send, Users, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import apiClient from '../api/index';

// ENH4-A6: SOCKET_URL 모듈 레벨 상수화 — useEffect 내 매 렌더마다 읽히는 문제 해결
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ✅ 5TH-C3: 메시지 시간 포매팅 헬퍼 — 중첩 삼항 제거
const formatMsgTime = (msg) => {
  if (msg.time) return msg.time;
  if (msg.createdAt) return new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  return '';
};

export default function CrewChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  // ✅ NEW-B5: 전체 store 구독 → 선택 구독 — 불필요한 리렌더 방지
  const user = useUserStore(s => s.user);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [crewName, setCrewName] = useState(''); // ✅ 실제 크루명
  const scrollRef = useRef();

  const myName = user?.name || user?.email || '익명';

  // ✅ 크루명 패치
  useEffect(() => {
    apiClient.get(`/api/community/crews/${id}`)
      .then(res => setCrewName(res.data?.name || ''))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    // ENH4-A6: 모듈 레벨 SOCKET_URL 상수 사용 (중복 선언 제거)
    // ✅ OPT-5: 핸드셰이크에 JWT 토큰 포함 → 서버에서 발신자 위조 방지
    const accessToken = localStorage.getItem('access_token') || undefined;
    const newSocket = io(SOCKET_URL, {
      // ─── 재연결 강화 옵션 ───────────────────────────
      reconnection: true,           // 자동 재연결 활성화
      reconnectionAttempts: Infinity, // 무한 재시도
      reconnectionDelay: 1000,      // 첫 재시도: 1초
      reconnectionDelayMax: 5000,   // 최대 재시도 간격: 5초
      timeout: 10000,               // 연결 타임아웃: 10초
      transports: ['websocket', 'polling'], // WebSocket 우선, polling fallback
      auth: { token: accessToken }, // JWT 핸드셰이크 인증
    });

    setSocket(newSocket);

    // 연결 상태 이벤트
    newSocket.on('connect',    () => { setConnected(true);  setReconnecting(false); });
    newSocket.on('disconnect', () => { setConnected(false); });
    newSocket.on('reconnecting', () => setReconnecting(true));
    newSocket.on('reconnect',  () => {
      setConnected(true);
      setReconnecting(false);
      newSocket.emit('join_crew', id); // 재연결 후 방 재입장
    });

    newSocket.emit('join_crew', id);

    newSocket.on('chat_history', (history) => setMessages(history));
    newSocket.on('new_msg', (msg) => setMessages(prev => {
      // 낙관적 메시지(자신이 보낸 temp_) 제거 후 서버 확인 메시지 추가
      const withoutOptimistic = prev.filter(m => !(m._isOptimistic && m.sender === msg.sender && m.text === msg.text));
      return [...withoutOptimistic, msg];
    }));


    // 화면 포커스 복귀 시 재연결 체크
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !newSocket.connected) {
        newSocket.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      newSocket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket || !connected) return;
    const text = input.trim();
    if (text.length > 500) return; // 클라이언트 측 최대 길이 제한 (500자)
    // ✅ 5TH-B3: crypto.randomUUID() — Date.now() 밀리초 충돌 방지 (빠른 연속 전송)
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp_${Date.now()}_${Math.random()}`;
    // 낙관적 업데이트 — 서버 응답 전 즉시 표시
    setMessages(prev => {
      const next = [...prev, {
        _id: tempId,
        sender: myName,
        text,
        createdAt: new Date().toISOString(),
        _isOptimistic: true,
      }];
      // 클라이언트 디스플레이 최대 300개 유지 (DOM 성능 보호)
      return next.length > 300 ? next.slice(-300) : next;
    });
    // ENH4-B5: sender는 클라이언트 전송값 사용 (JWT 핸드셸이크로 서버 인증 완료 시 서버에서 sender 추출 권장)
    socket.emit('send_msg', { crewId: id, sender: myName, text });
    setInput('');
  };


  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#F0F2F5' }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800' }}>{crewName || '크루 채팅방'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--primary)' }}>
            <ShieldCheck size={12} /> 보안된 프라이빗 채널
          </div>
        </div>
        {/* 연결 상태 표시 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: connected ? '#34C759' : '#FF3B30' }}>
          {reconnecting ? (
            <><span style={{ fontSize: '10px' }}>🔄</span> 재연결 중...</>
          ) : connected ? (
            <><Wifi size={13} /> 연결됨</>
          ) : (
            <><WifiOff size={13} /> 끊김</>
          )}
        </div>
        <Users size={20} color="#999" />
      </div>

      {/* 재연결 중 배너 */}
      {reconnecting && (
        <div style={{ background: '#FFF9C4', textAlign: 'center', padding: '6px', fontSize: '12px', color: '#856404' }}>
          🔄 서버에 재연결 중입니다...
        </div>
      )}

      {/* Chat Area */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {messages.map((msg, idx) => {
          const isMe = msg.sender === myName;
          return (
            <div
            // ✅ 23TH-B2: msg._id는 서버 응답에서 오며 낙관적 메시지도 _id:tempId로 항상 존재 — undefined 방지용 idx fallback 추가
            key={msg._id || `msg-${idx}`}
              style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}
            >
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textAlign: isMe ? 'right' : 'left' }}>
              {msg.sender} • {formatMsgTime(msg) /* ✅ 5TH-C3: formatMsgTime 헬퍼 사용 */}
              </div>
              <div style={{
                padding: '10px 14px',
                borderRadius: '16px',
                fontSize: '14px',
                lineHeight: '1.4',
                backgroundColor: isMe ? 'var(--primary)' : '#fff',
                color: isMe ? '#fff' : '#1c1c1e',
                borderBottomRightRadius: isMe ? '2px' : '16px',
                borderBottomLeftRadius: isMe ? '16px' : '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={connected ? '메시지를 입력하세요...' : '연결 중...'}
          disabled={!connected}
          style={{
            flex: 1, padding: '12px 16px',
            backgroundColor: connected ? '#f5f5f7' : '#eee',
            border: 'none', borderRadius: '24px', outline: 'none',
            fontSize: '14px', opacity: connected ? 1 : 0.6
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          style={{
            backgroundColor: (input.trim() && connected) ? 'var(--primary)' : '#eee',
            color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }}
        >
          <Send size={18} />
        </button>
      </div>

      {/* ENH4-A5: 중복 인라인 <style> 태그 제거 — index.css의 .page-container 클래스 사용 */}
    </div>
  );
}
