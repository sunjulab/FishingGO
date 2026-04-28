import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ChevronLeft, Send, Users, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

export default function CrewChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const scrollRef = useRef();

  const myName = user?.name || user?.email || '익명';

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL, {
      // ─── 재연결 강화 옵션 ───────────────────────────
      reconnection: true,           // 자동 재연결 활성화
      reconnectionAttempts: Infinity, // 무한 재시도
      reconnectionDelay: 1000,      // 첫 재시도: 1초
      reconnectionDelayMax: 5000,   // 최대 재시도 간격: 5초
      timeout: 10000,               // 연결 타임아웃: 10초
      transports: ['websocket', 'polling'], // WebSocket 우선, polling fallback
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
    newSocket.on('new_msg', (msg) => setMessages(prev => [...prev, msg]));

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
    socket.emit('send_msg', {
      crewId: id,
      sender: myName,
      text: input.trim()
    });
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
          <h2 style={{ fontSize: '16px', fontWeight: '800' }}>크루 채팅방</h2>
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
              key={idx}
              style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}
            >
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textAlign: isMe ? 'right' : 'left' }}>
                {msg.sender} • {msg.time}
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
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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

      <style>{`
        .page-container { max-width: 480px; margin: 0 auto; }
      `}</style>
    </div>
  );
}
