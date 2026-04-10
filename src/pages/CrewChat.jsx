import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ChevronLeft, Send, Users, ShieldCheck } from 'lucide-react';

export default function CrewChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join_crew', id);

    newSocket.on('chat_history', (history) => {
      setMessages(history);
    });

    newSocket.on('new_msg', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => newSocket.disconnect();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input || !socket) return;
    socket.emit('send_msg', {
      crewId: id,
      sender: '나',
      text: input
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
        <Users size={20} color="#999" />
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            style={{ 
              alignSelf: msg.sender === '나' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textAlign: msg.sender === '나' ? 'right' : 'left' }}>
              {msg.sender} • {msg.time}
            </div>
            <div style={{ 
              padding: '10px 14px', 
              borderRadius: '16px', 
              fontSize: '14px', 
              lineHeight: '1.4',
              backgroundColor: msg.sender === '나' ? 'var(--primary)' : '#fff',
              color: msg.sender === '나' ? '#fff' : '#1c1c1e',
              borderBottomRightRadius: msg.sender === '나' ? '2px' : '16px',
              borderBottomLeftRadius: msg.sender === '나' ? '16px' : '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지를 입력하세요..."
          style={{ flex: 1, padding: '12px 16px', backgroundColor: '#f5f5f7', border: 'none', borderRadius: '24px', outline: 'none', fontSize: '14px' }}
        />
        <button 
          onClick={handleSend}
          disabled={!input}
          style={{ 
            backgroundColor: input ? 'var(--primary)' : '#eee', 
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
