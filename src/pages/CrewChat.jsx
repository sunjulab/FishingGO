import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ChevronLeft, Send, Users, ShieldCheck, Wifi, WifiOff, X, LogOut, Trash2, ExternalLink } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatMsgTime = (msg) => {
  if (msg.time) return msg.time;
  if (msg.createdAt) return new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  return '';
};

// 역할별 왕관 아이콘
const RoleBadge = ({ role }) => {
  if (role === 'owner')   return <span style={{ fontSize: '14px' }} title="크루장">👑</span>;   // 빨간 왕관
  if (role === 'officer') return <span style={{ fontSize: '14px' }} title="간부">🫅</span>;      // 핑크 왕관
  return null;
};

const RoleTag = ({ role }) => {
  if (role === 'owner')   return <span style={{ fontSize: '9px', background: '#FF3B30', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: '900' }}>👑 크루장</span>;
  if (role === 'officer') return <span style={{ fontSize: '9px', background: '#FF2D8B', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: '900' }}>🫅 간부</span>;
  return null;
};

export default function CrewChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [crewName, setCrewName] = useState('');
  const [crewOwner, setCrewOwner] = useState('');
  const [crewLimit, setCrewLimit] = useState(1000);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null); // { email, name }
  const [leavingCrew, setLeavingCrew] = useState(false);
  const [deletingCrew, setDeletingCrew] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const scrollRef = useRef();
  const mySocketId = useRef(null);

  const myName = user?.name || user?.email || '익명';
  const isOwner = crewOwner && user?.email === crewOwner;
  // 내 역할 확인
  const myRole = members.find(m => m.email === user?.email)?.role || 'member';
  const isOfficer = myRole === 'officer';

  // ✅ BUG-FIX: useCallback으로 안정화 — stale closure 방지 + useEffect deps 충돌 해소
  // ⚠️ 선언 위치: useEffect(L63) 이전에 위치해야 호출 시 TDZ 없음
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await apiClient.get(`/api/community/crews/${id}/members`);
      setMembers(res.data?.members || []);
    } catch { } finally { setLoadingMembers(false); }
  }, [id]);

  useEffect(() => {
    apiClient.get(`/api/community/crews/${id}`)
      .then(res => {
        setCrewName(res.data?.name || '');
        setCrewOwner(res.data?.owner || '');
        setCrewLimit(res.data?.limit != null ? res.data.limit : 1000);
      }).catch(() => {});
    loadMembers();
  }, [id, loadMembers]); // ✅ BUG-FIX: loadMembers를 deps에 포함 (useCallback으로 안정화됨)

  useEffect(() => {
    // ✅ FIX-STORAGE: localStorage.getItem try/catch — Safari 개인정보 보호 모드 StorageError 방어
    let accessToken;
    try { accessToken = localStorage.getItem('access_token') || undefined; } catch { accessToken = undefined; }
    const newSocket = io(SOCKET_URL, {
      reconnection: true, reconnectionAttempts: Infinity,
      reconnectionDelay: 1000, reconnectionDelayMax: 5000,
      timeout: 10000, transports: ['websocket', 'polling'],
      auth: { token: accessToken },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true); setReconnecting(false);
      mySocketId.current = newSocket.id;
      newSocket.emit('join_crew', id); // ✅ BUG-FIX: connect 완료 후 join_crew 발송 (연결 전 emit race condition 수정)
    });
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('reconnecting', () => setReconnecting(true));
    newSocket.on('reconnect', () => {
      setConnected(true); setReconnecting(false);
      newSocket.emit('join_crew', id); // 재연결 후 채팅방 재입장
    });
    newSocket.on('chat_history', (history) => setMessages(history));
    newSocket.on('new_msg', (msg) => setMessages(prev => {
      const next = [...prev, msg];
      return next.length > 300 ? next.slice(-300) : next;
    }));

    // 크루 해산 이벤트
    newSocket.on('crew_dissolved', ({ message }) => {
      addToast(message || '크루가 해산되었습니다.', 'error');
      navigate('/community?tab=crew');
    });
    // 크루장 위임 이벤트
    newSocket.on('crew_transferred', ({ newOwnerEmail, newOwnerName, message }) => {
      // ✅ FIX-MSG: message undefined 방어 — 서버가 message 필드를 생략하면 'undefined' 토스트 방지
      addToast(message || '크루장이 위임되었습니다.', 'success');
      if (user?.email === newOwnerEmail) {
        setCrewOwner(newOwnerEmail);
      }
      loadMembers();
    });
    // 강퇴 이벤트
    newSocket.on('member_kicked', ({ email }) => {
      if (user?.email === email) {
        addToast('크루장에 의해 강퇴되었습니다.', 'error');
        navigate('/community?tab=crew');
      } else { loadMembers(); }
    });

    // 역할 변경 이벤트
    newSocket.on('member_role_changed', () => { loadMembers(); });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !newSocket.connected) newSocket.connect();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      newSocket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket || !connected) return;
    if (input.trim().length > 500) return;
    socket.emit('send_msg', { crewId: id, sender: myName, text: input.trim() });
    setInput('');
  };

  const handleLeaveCrew = async () => {
    if (isOwner) { addToast('크루장은 탈퇴할 수 없습니다. 크루를 삭제해주세요.', 'error'); return; }
    setLeavingCrew(true);
    try {
      await apiClient.post(`/api/community/crews/${id}/leave`, { email: user?.email });
      addToast('크루에서 탈퇴했습니다.', 'success');
      navigate('/community?tab=crew');
    } catch (err) {
      addToast(err.response?.data?.error || '탈퇴에 실패했습니다.', 'error');
    } finally { setLeavingCrew(false); setShowLeaveConfirm(false); }
  };

  const handleDeleteCrew = async () => {
    setDeletingCrew(true);
    try {
      await apiClient.delete(`/api/community/crews/${id}`, { data: { email: user.email } });
      addToast('크루가 삭제되었습니다.', 'success');
      navigate('/community?tab=crew');
    } catch (err) {
      addToast(err.response?.data?.error || '크루 삭제에 실패했습니다.', 'error');
    } finally { setDeletingCrew(false); setShowDeleteConfirm(false); }
  };

  // 크루장 위임
  const handleTransferCrew = async () => {
    if (!transferTarget) return;
    setTransferring(true);
    try {
      await apiClient.patch(`/api/community/crews/${id}/transfer`, {
        email: user.email, newOwnerEmail: transferTarget.email
      });
      setCrewOwner(transferTarget.email);
      setMembers(prev => prev.map(m => ({
        ...m,
        role: m.email === user.email ? 'member' : m.email === transferTarget.email ? 'owner' : m.role
      })));
      addToast(`👑 ${transferTarget.name}님에게 크루장을 위임했습니다.`, 'success');
      setShowTransferModal(false);
      setTransferTarget(null);
    } catch (err) {
      addToast(err.response?.data?.error || '위임에 실패했습니다.', 'error');
    } finally { setTransferring(false); }
  };

  const handleKick = async (targetEmail, targetName) => {
    try {
      await apiClient.delete(`/api/community/crews/${id}/members/${encodeURIComponent(targetEmail)}`, {
        data: { email: user.email }
      });
      setMembers(prev => prev.filter(m => m.email !== targetEmail));
      addToast(`${targetName}님을 강퇴했습니다.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '강퇴에 실패했습니다.', 'error');
    }
  };

  const handleSetRole = async (targetEmail, targetName, newRole) => {
    try {
      await apiClient.patch(
        `/api/community/crews/${id}/members/${encodeURIComponent(targetEmail)}/role`,
        { email: user.email, role: newRole }
      );
      setMembers(prev => prev.map(m => m.email === targetEmail ? { ...m, role: newRole } : m));
      const label = newRole === 'officer' ? '간부로 임명' : '일반 크루원으로 변경';
      addToast(`${targetName}님을 ${label}했습니다.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '역할 변경에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#fff', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Header — ✅ SAFE-AREA: 상단 상태바 자동 회피 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => window.history.length <= 1 ? navigate('/community', { replace: true }) : navigate(-1)} style={{ border: 'none', background: 'none' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {crewName || '크루 채팅방'}
            {isOwner && <span style={{ fontSize: '16px' }}>👑</span>}
            {isOfficer && <span style={{ fontSize: '16px' }}>🫅</span>}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--primary)' }}>
            <ShieldCheck size={12} /> 보안된 프라이빗 채널
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: connected ? '#34C759' : '#FF3B30' }}>
          {reconnecting ? <><span style={{ fontSize: '10px' }}>🔄</span> 재연결 중...</> : connected ? <><Wifi size={13} /> 연결됨</> : <><WifiOff size={13} /> 끊김</>}
        </div>
        {/* 멤버 목록 버튼 */}
        <button
          onClick={() => { setShowMemberPanel(true); loadMembers(); }}
          style={{ border: 'none', background: '#F2F2F7', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          title="멤버 목록"
        >
          <Users size={18} color={members.length >= crewLimit ? '#FF3B30' : '#0056D2'} />
          <span style={{ fontSize: '12px', fontWeight: '800', color: members.length >= crewLimit ? '#FF3B30' : '#0056D2' }}>
            {members.length}/{crewLimit}
          </span>
          {members.length >= crewLimit && (
            <span style={{ fontSize: '9px', background: '#FF3B30', color: '#fff', padding: '1px 5px', borderRadius: '6px', fontWeight: '900', marginLeft: '2px' }}>FULL</span>
          )}
        </button>
      </div>

      {reconnecting && (
        <div style={{ background: '#FFF9C4', textAlign: 'center', padding: '6px', fontSize: '12px', color: '#856404' }}>
          🔄 서버에 재연결 중입니다...
        </div>
      )}

      {/* Chat Area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#F0F2F5' }}>
        {messages.map((msg, idx) => {
          const isMe =
            (msg.socketId && msg.socketId === mySocketId.current) ||
            msg.sender === myName ||
            msg.sender === user?.email;

          // ✅ POST-SHARE: 게시글 공유 카드
          if (msg.type === 'post_share') {
            return (
              <div key={String(msg._id || `msg-${idx}`)} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div style={{ fontSize: '11px', color: '#8e8e93', marginBottom: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  {msg.senderEmoji && <span style={{ fontSize: '13px' }}>{msg.senderEmoji}</span>}
                  <span style={{ fontWeight: '700', color: isMe ? '#0056D2' : '#1c1c1e', fontSize: '12px' }}>{msg.sender}</span>
                  <span style={{ color: '#c0c0c0', fontSize: '10px' }}>• {formatMsgTime(msg)}</span>
                </div>
                {/* 공유 카드 */}
                <div
                  onClick={() => {
                    const cat = msg.postCategory || '';
                    if (cat.includes('공지')) navigate(`/notice/${msg.postId}`);
                    else if (cat.includes('선상배') || cat.includes('홍보')) navigate('/community?tab=business');
                    else navigate(`/post/${msg.postId}`);
                  }}
                  style={{
                    background: isMe ? 'linear-gradient(135deg,#0056D2,#1565C0)' : '#fff',
                    borderRadius: '16px',
                    borderBottomRightRadius: isMe ? '4px' : '16px',
                    borderBottomLeftRadius: isMe ? '16px' : '4px',
                    overflow: 'hidden', cursor: 'pointer',
                    boxShadow: isMe ? '0 4px 16px rgba(0,86,210,0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
                    border: isMe ? 'none' : '1px solid #E5E5EA',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = isMe ? '0 4px 16px rgba(0,86,210,0.3)' : '0 2px 10px rgba(0,0,0,0.1)'; }}
                >
                  {/* 헤더 배지 */}
                  <div style={{ padding: '8px 12px', background: isMe ? 'rgba(255,255,255,0.12)' : 'rgba(0,86,210,0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>
                      {(msg.postCategory || '').includes('공지') ? '📢' : (msg.postCategory || '').includes('선상배') ? '🚢' : '📸'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: isMe ? 'rgba(255,255,255,0.9)' : '#0056D2' }}>
                      {(msg.postCategory || '').includes('공지') ? '공지사항' : (msg.postCategory || '').includes('선상배') ? '선상배 홍보' : '오픈게시판'}
                    </span>
                    <span style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.55)' : '#aaa', marginLeft: 'auto' }}>{msg.postCategory}</span>
                  </div>
                  {/* 이미지 + 내용 */}
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {msg.postImage && (
                      <img src={msg.postImage} alt="" style={{ width: '70px', height: '70px', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ padding: '10px 12px', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: isMe ? '#fff' : '#1c1c1e', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {msg.postTitle || '(내용 없음)'}
                      </div>
                    </div>
                  </div>
                  {/* 풀버튼 */}
                  <div style={{ padding: '8px 12px', borderTop: `1px solid ${isMe ? 'rgba(255,255,255,0.15)' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: isMe ? 'rgba(255,255,255,0.8)' : '#0056D2', fontSize: '12px', fontWeight: '800' }}>
                    <ExternalLink size={12} />
                    게시글 보러가기
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={String(msg._id || `msg-${idx}`)} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{ fontSize: '11px', color: '#8e8e93', marginBottom: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                {msg.senderEmoji && <span style={{ fontSize: '13px' }}>{msg.senderEmoji}</span>}
                <span style={{ fontWeight: '700', color: isMe ? '#0056D2' : '#1c1c1e', fontSize: '12px' }}>{msg.sender}</span>
                {!isMe && msg.senderTitle && (
                  <span style={{ fontSize: '9px', background: '#F0F4FF', color: '#0056D2', padding: '1px 5px', borderRadius: '6px', fontWeight: '800', border: '1px solid #D0DEFF' }}>
                    {msg.senderLevel} {msg.senderTitle}
                  </span>
                )}
                {isMe && msg.senderTitle && (
                  <span style={{ fontSize: '9px', background: '#E8F4FF', color: '#0056D2', padding: '1px 5px', borderRadius: '6px', fontWeight: '800' }}>
                    {msg.senderLevel}
                  </span>
                )}
                <span style={{ color: '#c0c0c0', fontSize: '10px' }}>• {formatMsgTime(msg)}</span>
              </div>
              <div style={{
                padding: '10px 14px', borderRadius: '18px', fontSize: '14px', lineHeight: '1.5',
                backgroundColor: isMe ? '#0056D2' : '#fff', color: isMe ? '#fff' : '#1c1c1e',
                borderBottomRightRadius: isMe ? '4px' : '18px', borderBottomLeftRadius: isMe ? '18px' : '4px',
                boxShadow: isMe ? '0 4px 12px rgba(0,86,210,0.25)' : '0 2px 6px rgba(0,0,0,0.06)', fontWeight: '500',
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area — overflow:hidden으로 버튼 가림 방지 */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
        {/* 크루장: 삭제 버튼 / 일반: 나가기 버튼 */}
        {isOwner ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{ border: 'none', background: '#FFF0F0', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
            title="크루 삭제"
          >
            <Trash2 size={18} color="#FF3B30" />
          </button>
        ) : (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            style={{ border: 'none', background: '#FFF0F0', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
            title="크루 나가기"
          >
            <LogOut size={18} color="#FF3B30" />
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={connected ? '메시지를 입력하세요...' : '연결 중...'}
          disabled={!connected}
          style={{
            flex: 1,
            minWidth: 0,             // ✅ FIX: flex shrink 허용 — 버튼 가림 방지
            padding: '12px 14px',
            backgroundColor: connected ? '#f5f5f7' : '#eee',
            border: 'none',
            borderRadius: '24px',
            outline: 'none',
            fontSize: '14px',
            opacity: connected ? 1 : 0.6,
            boxSizing: 'border-box', // ✅ padding이 너비에 포함되도록
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          style={{ backgroundColor: (input.trim() && connected) ? 'var(--primary)' : '#eee', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
        >
          <Send size={18} />
        </button>
      </div>

      {/* ── 멤버 목록 패널 ── */}
      {showMemberPanel && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMemberPanel(false); }}
        >
          <div style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '4px', background: '#E5E5EA', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1c1c1e' }}>
                크루원 {members.length}명
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#aaa', marginLeft: '6px' }}>/ {crewLimit}명 정원</span>
              </h3>
              <button onClick={() => setShowMemberPanel(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={22} color="#666" />
              </button>
            </div>

            {/* 범례 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '11px', color: '#888' }}>
              <span>👑 <span style={{ color: '#FF3B30', fontWeight: '800' }}>크루장</span></span>
              <span>🫅 <span style={{ color: '#FF2D8B', fontWeight: '800' }}>간부</span></span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#aaa' }}>불러오는 중...</div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontSize: '14px' }}>멤버 정보가 없습니다.</div>
              ) : members.map((m, i) => {
                const isThisOwner = m.role === 'owner' || m.email === crewOwner;
                const isThisOfficer = m.role === 'officer';
                const isMe = m.email === user?.email;
                return (
                  <div key={m.email || i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    background: isMe ? '#F0F5FF' : isThisOwner ? '#FFF8F8' : isThisOfficer ? '#FFF0F8' : '#F8F8FA',
                    borderRadius: '14px',
                    border: isThisOwner ? '1.5px solid #FFD0D0' : isThisOfficer ? '1.5px solid #FFD0E8' : isMe ? '1.5px solid #D0E4FF' : 'none'
                  }}>
                    {/* 아바타 */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                      background: isThisOwner ? 'linear-gradient(135deg,#FF3B30,#FF6060)' : isThisOfficer ? 'linear-gradient(135deg,#FF2D8B,#FF6DB6)' : 'linear-gradient(135deg,#0056D2,#0096FF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: '900', fontSize: '16px', position: 'relative'
                    }}>
                      {m.name?.[0] || '?'}
                    </div>

                    {/* 이름 + 배지 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <RoleBadge role={isThisOwner ? 'owner' : m.role} />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#1c1c1e' }}>{m.name}</span>
                        <RoleTag role={isThisOwner ? 'owner' : m.role} />
                        {isMe && !isThisOwner && <span style={{ fontSize: '9px', background: '#0056D2', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: '900' }}>나</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                        {m.joinedAt ? `가입 ${new Date(m.joinedAt).toLocaleDateString('ko-KR')}` : ''}
                      </div>
                    </div>

                    {/* 크루장만 볼 수 있는 액션 버튼 (자신 제외, 다른 크루장 제외) */}
                    {isOwner && !isThisOwner && !isMe && (
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {/* 크루장 위임 버튼 */}
                        <button
                          onClick={() => { setTransferTarget({ email: m.email, name: m.name }); setShowTransferModal(true); }}
                          style={{ border: 'none', background: 'rgba(255,215,0,0.15)', color: '#B8860B', padding: '6px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >👑 위임</button>
                        {/* 간부 설정/해제 */}
                        {isThisOfficer ? (
                          <button
                            onClick={() => handleSetRole(m.email, m.name, 'member')}
                            style={{ border: 'none', background: 'rgba(255,45,139,0.1)', color: '#FF2D8B', padding: '6px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            간부 해제
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSetRole(m.email, m.name, 'officer')}
                            style={{ border: 'none', background: 'rgba(255,45,139,0.08)', color: '#FF2D8B', padding: '6px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            🫅 간부
                          </button>
                        )}
                        {/* 강퇴 */}
                        <button
                          onClick={() => handleKick(m.email, m.name)}
                          style={{ border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '6px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          강퇴
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 나가기 확인 다이얼로그 ── */}
      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚪</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1c1c1e', marginBottom: '8px' }}>크루를 탈퇴할까요?</div>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '24px' }}>탈퇴 후 재입장하려면 다시 비밀번호를 입력해야 합니다.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeaveConfirm(false)} style={{ flex: 1, padding: '13px', border: '1.5px solid #E5E5EA', borderRadius: '12px', background: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer', color: '#666' }}>취소</button>
              <button onClick={handleLeaveCrew} disabled={leavingCrew} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '12px', background: '#FF3B30', fontSize: '14px', fontWeight: '900', cursor: 'pointer', color: '#fff' }}>
                {leavingCrew ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 크루장 위임 확인 다이얼로그 ── */}
      {showTransferModal && transferTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👑</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1c1c1e', marginBottom: '8px' }}>크루장을 위임할까요?</div>
            <div style={{ fontSize: '14px', color: '#0056D2', fontWeight: '800', marginBottom: '6px' }}>{transferTarget.name}</div>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '24px' }}>위임 후 회원님은 일반 크루원으로 변경됩니다.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowTransferModal(false); setTransferTarget(null); }} style={{ flex: 1, padding: '13px', border: '1.5px solid #E5E5EA', borderRadius: '12px', background: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer', color: '#666' }}>취소</button>
              <button onClick={handleTransferCrew} disabled={transferring} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg,#FFD700,#FFA000)', fontSize: '14px', fontWeight: '900', cursor: 'pointer', color: '#1c1c1e' }}>
                {transferring ? '처리 중...' : '위임하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 크루 삭제 확인 다이얼로그 (크루장 전용) ── */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#FF3B30', marginBottom: '8px' }}>크루를 삭제할까요?</div>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '24px' }}>삭제된 크루와 채팅 기록은 복구할 수 없습니다.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '13px', border: '1.5px solid #E5E5EA', borderRadius: '12px', background: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer', color: '#666' }}>취소</button>
              <button onClick={handleDeleteCrew} disabled={deletingCrew} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '12px', background: '#FF3B30', fontSize: '14px', fontWeight: '900', cursor: 'pointer', color: '#fff' }}>
                {deletingCrew ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
