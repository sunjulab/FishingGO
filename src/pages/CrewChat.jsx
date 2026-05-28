import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ChevronLeft, Send, Users, ShieldCheck, Wifi, WifiOff, X, LogOut, Trash2, ExternalLink, CornerUpLeft, Camera } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import { fileToCompressedBase64 } from '../utils/imageUtils';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatMsgTime = (msg) => {
  if (msg.time) return msg.time;
  if (msg.createdAt) return new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  return '';
};

const RoleBadge = ({ role }) => {
  if (role === 'owner')   return <span style={{ fontSize: `calc(14px * var(--fs, 1))` }} title="크루장">👑</span>;
  if (role === 'officer') return <span style={{ fontSize: `calc(14px * var(--fs, 1))` }} title="간부">🫅</span>;
  return null;
};

const RoleTag = ({ role }) => {
  if (role === 'owner')   return <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#FF3B30', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: '900' }}>👑 크루장</span>;
  if (role === 'officer') return <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#FF2D8B', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: '900' }}>🫅 간부</span>;
  return null;
};

// ✅ REPLY: 인용 버블 컴포넌트
const QuoteBubble = ({ replyTo: r, isMe }) => (
  <div style={{
    background: isMe ? 'rgba(255,255,255,0.18)' : 'rgba(0,86,210,0.07)',
    borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.7)' : '#0056D2'}`,
    borderRadius: '8px',
    padding: '6px 10px',
    marginBottom: '5px',
    maxWidth: '100%',
    overflow: 'hidden',
  }}>
    <div style={{
      fontSize: `calc(11px * var(--fs, 1))`,
      fontWeight: '800',
      color: isMe ? 'rgba(255,255,255,0.85)' : '#0056D2',
      marginBottom: '2px',
      display: 'flex', alignItems: 'center', gap: '4px',
    }}>
      <CornerUpLeft size={10} />
      {r.sender}
    </div>
    <div style={{
      fontSize: `calc(12px * var(--fs, 1))`,
      color: isMe ? 'rgba(255,255,255,0.65)' : '#666',
      fontWeight: '500',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    }}>
      {(r.text || '[게시글 공유]').slice(0, 80)}
    </div>
  </div>
);

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
  const [transferTarget, setTransferTarget] = useState(null);
  const [leavingCrew, setLeavingCrew] = useState(false);
  const [deletingCrew, setDeletingCrew] = useState(false);
  const [transferring, setTransferring] = useState(false);

  // ✅ CREW-LOGO
  const [crewLogo, setCrewLogo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileRef = useRef(null);

  // ✅ REPLY STATE
  const [replyTo, setReplyTo] = useState(null);        // { sender, text }
  const [contextMenu, setContextMenu] = useState(null); // { msg, x, y }

  const scrollRef = useRef();
  const mySocketId = useRef(null);
  const longPressTimer = useRef(null);
  const inputRef = useRef();

  const myName = user?.name || user?.email || '익명';
  const isOwner = crewOwner && user?.email === crewOwner;
  const myRole = members.find(m => m.email === user?.email)?.role || 'member';
  const isOfficer = myRole === 'officer';

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await apiClient.get(`/api/community/crews/${id}/members`);
      setMembers(res.data?.members || []);
    } catch {} finally { setLoadingMembers(false); }
  }, [id]);

  useEffect(() => {
    apiClient.get(`/api/community/crews/${id}`)
      .then(res => {
        setCrewName(res.data?.name || '');
        setCrewOwner(res.data?.owner || '');
        setCrewLimit(res.data?.limit != null ? res.data.limit : 1000);
        setCrewLogo(res.data?.logo || null); // ✅ CREW-LOGO
      }).catch(() => {});
    loadMembers();
  }, [id, loadMembers]);

  // ✅ CREW-LOGO: 로고 업로드 핸들러 (방장 전용)
  const handleLogoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return addToast('이미지 파일만 업로드 가능합니다.', 'error');
    setUploadingLogo(true);
    try {
      const base64 = await fileToCompressedBase64(file, { maxWidth: 512, maxHeight: 512, preset: 'avatar' });
      await apiClient.put(`/api/community/crews/${id}/logo`, { logo: base64 });
      setCrewLogo(base64);
      addToast('✅ 크루 로고가 업데이트되었습니다!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '로고 업로드에 실패했습니다.', 'error');
    } finally {
      setUploadingLogo(false);
      if (logoFileRef.current) logoFileRef.current.value = '';
    }
  }, [id, addToast]);

  useEffect(() => {
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
      newSocket.emit('join_crew', id);
    });
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('reconnecting', () => setReconnecting(true));
    newSocket.on('reconnect', () => {
      setConnected(true); setReconnecting(false);
      newSocket.emit('join_crew', id);
    });
    newSocket.on('chat_history', (history) => setMessages(history));
    newSocket.on('new_msg', (msg) => setMessages(prev => {
      const next = [...prev, msg];
      return next.length > 300 ? next.slice(-300) : next;
    }));
    newSocket.on('crew_dissolved', ({ message }) => {
      addToast(message || '크루가 해산되었습니다.', 'error');
      navigate('/community?tab=crew');
    });
    newSocket.on('crew_transferred', ({ newOwnerEmail, message }) => {
      addToast(message || '크루장이 위임되었습니다.', 'success');
      if (user?.email === newOwnerEmail) setCrewOwner(newOwnerEmail);
      loadMembers();
    });
    newSocket.on('member_kicked', ({ email }) => {
      if (user?.email === email) {
        addToast('크루장에 의해 강퇴되었습니다.', 'error');
        navigate('/community?tab=crew');
      } else { loadMembers(); }
    });
    newSocket.on('member_role_changed', () => { loadMembers(); });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !newSocket.connected) newSocket.connect();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      // ✅ LEAK-FIX: 언마운트 시 longPressTimer 정리 (메모리 리크 방지)
      clearTimeout(longPressTimer.current);
      newSocket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // 컨텍스트 메뉴 외부 클릭 닫기
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const t = setTimeout(() => document.addEventListener('click', close, { once: true }), 10);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [contextMenu]);

  // ── 꾹 누르기 (모바일 터치) ──────────────────────────────────
  const handleTouchStart = useCallback((e, msg) => {
    // ✅ TOUCH-FIX: 좌표를 setTimeout 등록 전에 즉시 캡처 (600ms 후 e.touches 빈 배열 race condition 방지)
    const touch = e.touches?.[0];
    const capturedX = touch?.clientX ?? window.innerWidth / 2;
    const capturedY = touch?.clientY ?? window.innerHeight / 2;
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40);
      setContextMenu({
        msg,
        x: Math.min(capturedX, window.innerWidth - 160),
        y: Math.min(capturedY, window.innerHeight - 110),
      });
    }, 600);
  }, []);

  const handleTouchEnd = useCallback(() => { clearTimeout(longPressTimer.current); }, []);
  const handleTouchMove = useCallback(() => { clearTimeout(longPressTimer.current); }, []);

  // ── 우클릭 (PC) ──────────────────────────────────────────────
  const handleContextMenu = useCallback((e, msg) => {
    e.preventDefault();
    setContextMenu({
      msg,
      x: Math.min(e.clientX, window.innerWidth - 160),
      y: Math.min(e.clientY, window.innerHeight - 110),
    });
  }, []);

  // ── 답장 선택 ────────────────────────────────────────────────
  const handleSelectReply = useCallback((msg) => {
    setReplyTo({ sender: msg.sender, text: msg.text || '[게시글 공유]' });
    setContextMenu(null);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // ── 메시지 전송 ──────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim() || !socket || !connected) return;
    if (input.trim().length > 500) return;
    socket.emit('send_msg', {
      crewId: id,
      sender: myName,
      text: input.trim(),
      replyTo: replyTo ? { sender: replyTo.sender, text: replyTo.text } : null,
    });
    setInput('');
    setReplyTo(null);
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
      setShowTransferModal(false); setTransferTarget(null);
    } catch (err) {
      addToast(err.response?.data?.error || '위임에 실패했습니다.', 'error');
    } finally { setTransferring(false); }
  };

  const handleKick = async (targetEmail, targetName) => {
    try {
      await apiClient.delete(`/api/community/crews/${id}/members/${encodeURIComponent(targetEmail)}`, { data: { email: user.email } });
      setMembers(prev => prev.filter(m => m.email !== targetEmail));
      addToast(`${targetName}님을 강퇴했습니다.`, 'success');
    } catch (err) { addToast(err.response?.data?.error || '강퇴에 실패했습니다.', 'error'); }
  };

  const handleSetRole = async (targetEmail, targetName, newRole) => {
    try {
      await apiClient.patch(
        `/api/community/crews/${id}/members/${encodeURIComponent(targetEmail)}/role`,
        { email: user.email, role: newRole }
      );
      setMembers(prev => prev.map(m => m.email === targetEmail ? { ...m, role: newRole } : m));
      addToast(`${targetName}님을 ${newRole === 'officer' ? '간부로 임명' : '일반 크루원으로 변경'}했습니다.`, 'success');
    } catch (err) { addToast(err.response?.data?.error || '역할 변경에 실패했습니다.', 'error'); }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#fff', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

      {/* ── 헤더 ── */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => window.history.length <= 1 ? navigate('/community', { replace: true }) : navigate(-1)} style={{ border: 'none', background: 'none' }}>
          <ChevronLeft size={24} />
        </button>

        {/* ✅ CREW-LOGO: 원형 로고 (방장은 탭하여 변경) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => isOwner && logoFileRef.current?.click()}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              background: crewLogo ? 'transparent' : 'linear-gradient(135deg, #0056D2, #00C48C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isOwner ? 'pointer' : 'default',
              border: '2px solid #E5E5EA',
              opacity: uploadingLogo ? 0.5 : 1,
            }}
          >
            {crewLogo
              ? <img src={crewLogo} alt="크루 로고" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '20px' }}>⚓</span>
            }
          </div>
          {/* 방장 카메라 오버레이 */}
          {isOwner && (
            <div
              onClick={() => logoFileRef.current?.click()}
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: '16px', height: '16px', borderRadius: '50%',
                background: uploadingLogo ? '#AEAEB2' : '#0056D2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '1.5px solid #fff',
              }}
            >
              {uploadingLogo
                ? <span style={{ fontSize: '8px' }}>⏳</span>
                : <Camera size={9} color="#fff" />
              }
            </div>
          )}
          <input
            ref={logoFileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleLogoUpload}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {crewName || '크루 채팅방'}
            {isOwner && <span style={{ fontSize: `calc(16px * var(--fs, 1))` }}>👑</span>}
            {isOfficer && <span style={{ fontSize: `calc(16px * var(--fs, 1))` }}>🫅</span>}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: `calc(11px * var(--fs, 1))`, color: 'var(--primary)' }}>
            <ShieldCheck size={12} /> 보안된 프라이빗 채널
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: `calc(11px * var(--fs, 1))`, color: connected ? '#34C759' : '#FF3B30' }}>
          {reconnecting ? <><span style={{ fontSize: `calc(10px * var(--fs, 1))` }}>🔄</span> 재연결 중...</> : connected ? <><Wifi size={13} /> 연결됨</> : <><WifiOff size={13} /> 끊김</>}
        </div>
        <button
          onClick={() => { setShowMemberPanel(true); loadMembers(); }}
          style={{ border: 'none', background: '#F2F2F7', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Users size={18} color={members.length >= crewLimit ? '#FF3B30' : '#0056D2'} />
          <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: members.length >= crewLimit ? '#FF3B30' : '#0056D2' }}>
            {members.length}/{crewLimit}
          </span>
          {members.length >= crewLimit && (
            <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#FF3B30', color: '#fff', padding: '1px 5px', borderRadius: '6px', fontWeight: '900', marginLeft: '2px' }}>FULL</span>
          )}
        </button>
      </div>

      {reconnecting && (
        <div style={{ background: '#FFF9C4', textAlign: 'center', padding: '6px', fontSize: `calc(12px * var(--fs, 1))`, color: '#856404' }}>
          🔄 서버에 재연결 중입니다...
        </div>
      )}

      {/* ✅ REPLY HINT */}
      <div style={{ background: '#F0F5FF', textAlign: 'center', padding: '5px 16px', fontSize: `calc(10px * var(--fs, 1))`, color: '#0056D2', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <CornerUpLeft size={11} /> 메시지 꾹 누르기 → 답장
      </div>

      {/* ── 채팅 영역 ── */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#F0F2F5' }}
        onClick={() => setContextMenu(null)}
      >
        {messages.map((msg, idx) => {
          const isMe =
            (msg.socketId && msg.socketId === mySocketId.current) ||
            msg.sender === myName ||
            msg.sender === user?.email;

          // 게시글 공유 카드
          if (msg.type === 'post_share') {
            return (
              <div
                key={String(msg._id || `msg-${idx}`)}
                style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '82%', userSelect: 'none' }}
                onTouchStart={(e) => handleTouchStart(e, msg)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onContextMenu={(e) => handleContextMenu(e, msg)}
              >
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8e8e93', marginBottom: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  {msg.senderEmoji && <span style={{ fontSize: `calc(13px * var(--fs, 1))` }}>{msg.senderEmoji}</span>}
                  <span style={{ fontWeight: '700', color: isMe ? '#0056D2' : '#1c1c1e', fontSize: `calc(12px * var(--fs, 1))` }}>{msg.sender}</span>
                  <span style={{ color: '#c0c0c0', fontSize: `calc(10px * var(--fs, 1))` }}>• {formatMsgTime(msg)}</span>
                </div>
                {/* 인용 버블 (공유 메시지에 답장 달린 경우) */}
                {msg.replyTo && <QuoteBubble replyTo={msg.replyTo} isMe={isMe} />}
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
                  }}
                >
                  <div style={{ padding: '8px 12px', background: isMe ? 'rgba(255,255,255,0.12)' : 'rgba(0,86,210,0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: `calc(14px * var(--fs, 1))` }}>
                      {(msg.postCategory || '').includes('공지') ? '📢' : (msg.postCategory || '').includes('선상배') ? '🚢' : '📸'}
                    </span>
                    <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: isMe ? 'rgba(255,255,255,0.9)' : '#0056D2' }}>
                      {(msg.postCategory || '').includes('공지') ? '공지사항' : (msg.postCategory || '').includes('선상배') ? '선상배 홍보' : '오픈게시판'}
                    </span>
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: isMe ? 'rgba(255,255,255,0.55)' : '#aaa', marginLeft: 'auto' }}>{msg.postCategory}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {msg.postImage && <img src={msg.postImage} alt="" style={{ width: '70px', height: '70px', objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ padding: '10px 12px', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', color: isMe ? '#fff' : '#1c1c1e', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {msg.postTitle || '(내용 없음)'}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', borderTop: `1px solid ${isMe ? 'rgba(255,255,255,0.15)' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: isMe ? 'rgba(255,255,255,0.8)' : '#0056D2', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800' }}>
                    <ExternalLink size={12} /> 게시글 보러가기
                  </div>
                </div>
              </div>
            );
          }

          // 일반 텍스트 메시지
          return (
            <div
              key={String(msg._id || `msg-${idx}`)}
              style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '78%', userSelect: 'none' }}
              onTouchStart={(e) => handleTouchStart(e, msg)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              {/* 발신자 */}
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8e8e93', marginBottom: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                {msg.senderEmoji && <span style={{ fontSize: `calc(13px * var(--fs, 1))` }}>{msg.senderEmoji}</span>}
                <span style={{ fontWeight: '700', color: isMe ? '#0056D2' : '#1c1c1e', fontSize: `calc(12px * var(--fs, 1))` }}>{msg.sender}</span>
                {!isMe && msg.senderTitle && (
                  <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#F0F4FF', color: '#0056D2', padding: '1px 5px', borderRadius: '6px', fontWeight: '800', border: '1px solid #D0DEFF' }}>
                    {msg.senderLevel} {msg.senderTitle}
                  </span>
                )}
                {isMe && msg.senderTitle && (
                  <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#E8F4FF', color: '#0056D2', padding: '1px 5px', borderRadius: '6px', fontWeight: '800' }}>
                    {msg.senderLevel}
                  </span>
                )}
                <span style={{ color: '#c0c0c0', fontSize: `calc(10px * var(--fs, 1))` }}>• {formatMsgTime(msg)}</span>
              </div>

              {/* ✅ 인용 버블 + 메시지 버블 */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {msg.replyTo && <QuoteBubble replyTo={msg.replyTo} isMe={isMe} />}
                <div style={{
                  padding: '10px 14px', borderRadius: '18px',
                  fontSize: `calc(14px * var(--fs, 1))`, lineHeight: '1.5',
                  backgroundColor: isMe ? '#0056D2' : '#fff',
                  color: isMe ? '#fff' : '#1c1c1e',
                  borderBottomRightRadius: isMe ? '4px' : '18px',
                  borderBottomLeftRadius: isMe ? '18px' : '4px',
                  boxShadow: isMe ? '0 4px 12px rgba(0,86,210,0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
                  fontWeight: '500', wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ 답장 미리보기 바 */}
      {replyTo && (
        <div style={{
          background: '#EEF4FF',
          borderTop: '2px solid #0056D2',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <CornerUpLeft size={16} color="#0056D2" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: '#0056D2' }}>
              {replyTo.sender}에게 답장
            </div>
            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#555', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {replyTo.text.slice(0, 60)}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ border: 'none', background: 'rgba(0,0,0,0.06)', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={15} color="#666" />
          </button>
        </div>
      )}

      {/* ── 입력 영역 ── */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
        {isOwner ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{ border: 'none', background: '#FFF0F0', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
            <Trash2 size={18} color="#FF3B30" />
          </button>
        ) : (
          <button onClick={() => setShowLeaveConfirm(true)} style={{ border: 'none', background: '#FFF0F0', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
            <LogOut size={18} color="#FF3B30" />
          </button>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={
            !connected ? '연결 중...' :
            replyTo ? `${replyTo.sender}에게 답장...` :
            '메시지를 입력하세요...'
          }
          disabled={!connected}
          style={{
            flex: 1, minWidth: 0,
            padding: '12px 14px',
            backgroundColor: connected ? (replyTo ? '#EEF4FF' : '#f5f5f7') : '#eee',
            border: replyTo ? '1.5px solid #0056D2' : 'none',
            borderRadius: '24px', outline: 'none',
            fontSize: `calc(14px * var(--fs, 1))`,
            opacity: connected ? 1 : 0.6,
            boxSizing: 'border-box',
            transition: 'all 0.2s',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          style={{ backgroundColor: (input.trim() && connected) ? '#0056D2' : '#eee', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
        >
          <Send size={18} />
        </button>
      </div>

      {/* ✅ 컨텍스트 메뉴 (꾹 누르기 팝업) */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 19999, // ✅ Z-FIX: 멤버 패널(9000)/모달(9001~9002) 위에 표시
            background: '#fff',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            minWidth: '148px',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleSelectReply(contextMenu.msg)}
            style={{
              width: '100%', padding: '14px 18px', border: 'none', background: 'none',
              display: 'flex', alignItems: 'center', gap: '10px',
              fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', color: '#0056D2',
              cursor: 'pointer',
            }}
          >
            <CornerUpLeft size={16} color="#0056D2" />
            답장하기
          </button>
          <div style={{ height: '1px', background: '#f0f0f0' }} />
          <button
            onClick={() => setContextMenu(null)}
            style={{
              width: '100%', padding: '12px 18px', border: 'none', background: 'none',
              fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', color: '#aaa',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      )}

      {/* ── 멤버 목록 패널 ── */}
      {showMemberPanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMemberPanel(false); }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '4px', background: '#E5E5EA', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}>
                크루원 {members.length}명
                <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '600', color: '#aaa', marginLeft: '6px' }}>/ {crewLimit}명 정원</span>
              </h3>
              <button onClick={() => setShowMemberPanel(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={22} color="#666" /></button>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: `calc(11px * var(--fs, 1))`, color: '#888' }}>
              <span>👑 <span style={{ color: '#FF3B30', fontWeight: '800' }}>크루장</span></span>
              <span>🫅 <span style={{ color: '#FF2D8B', fontWeight: '800' }}>간부</span></span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#aaa' }}>불러오는 중...</div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#aaa' }}>멤버 정보가 없습니다.</div>
              ) : members.map((m, i) => {
                const isThisOwner = m.role === 'owner' || m.email === crewOwner;
                const isThisOfficer = m.role === 'officer';
                const isMe2 = m.email === user?.email;
                return (
                  <div key={m.email || i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    background: isMe2 ? '#F0F5FF' : isThisOwner ? '#FFF8F8' : isThisOfficer ? '#FFF0F8' : '#F8F8FA',
                    borderRadius: '14px',
                    border: isThisOwner ? '1.5px solid #FFD0D0' : isThisOfficer ? '1.5px solid #FFD0E8' : isMe2 ? '1.5px solid #D0E4FF' : 'none'
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, background: isThisOwner ? 'linear-gradient(135deg,#FF3B30,#FF6060)' : isThisOfficer ? 'linear-gradient(135deg,#FF2D8B,#FF6DB6)' : 'linear-gradient(135deg,#0056D2,#0096FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: `calc(16px * var(--fs, 1))` }}>
                      {m.name?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <RoleBadge role={isThisOwner ? 'owner' : m.role} />
                        <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e' }}>{m.name}</span>
                        <RoleTag role={isThisOwner ? 'owner' : m.role} />
                        {isMe2 && !isThisOwner && <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#0056D2', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: '900' }}>나</span>}
                      </div>
                      <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#aaa', marginTop: '2px' }}>
                        {m.joinedAt ? `가입 ${new Date(m.joinedAt).toLocaleDateString('ko-KR')}` : ''}
                      </div>
                    </div>
                    {isOwner && !isThisOwner && !isMe2 && (
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setTransferTarget({ email: m.email, name: m.name }); setShowTransferModal(true); }} style={{ border: 'none', background: 'rgba(255,215,0,0.15)', color: '#B8860B', padding: '6px 8px', borderRadius: '10px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}>👑 위임</button>
                        {isThisOfficer ? (
                          <button onClick={() => handleSetRole(m.email, m.name, 'member')} style={{ border: 'none', background: 'rgba(255,45,139,0.1)', color: '#FF2D8B', padding: '6px 10px', borderRadius: '10px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}>간부 해제</button>
                        ) : (
                          <button onClick={() => handleSetRole(m.email, m.name, 'officer')} style={{ border: 'none', background: 'rgba(255,45,139,0.08)', color: '#FF2D8B', padding: '6px 10px', borderRadius: '10px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}>🫅 간부</button>
                        )}
                        <button onClick={() => handleKick(m.email, m.name)} style={{ border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '6px 10px', borderRadius: '10px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}>강퇴</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 나가기 확인 ── */}
      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: `calc(36px * var(--fs, 1))`, marginBottom: '12px' }}>🚪</div>
            <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', marginBottom: '8px' }}>크루를 탈퇴할까요?</div>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#aaa', marginBottom: '24px' }}>탈퇴 후 재입장하려면 다시 비밀번호를 입력해야 합니다.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeaveConfirm(false)} style={{ flex: 1, padding: '13px', border: '1.5px solid #E5E5EA', borderRadius: '12px', background: '#fff', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', color: '#666' }}>취소</button>
              <button onClick={handleLeaveCrew} disabled={leavingCrew} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '12px', background: '#FF3B30', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', color: '#fff' }}>
                {leavingCrew ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 위임 확인 ── */}
      {showTransferModal && transferTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: `calc(36px * var(--fs, 1))`, marginBottom: '12px' }}>👑</div>
            <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', marginBottom: '8px' }}>크루장을 위임할까요?</div>
            <div style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#0056D2', fontWeight: '800', marginBottom: '6px' }}>{transferTarget.name}</div>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#aaa', marginBottom: '24px' }}>위임 후 회원님은 일반 크루원으로 변경됩니다.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowTransferModal(false); setTransferTarget(null); }} style={{ flex: 1, padding: '13px', border: '1.5px solid #E5E5EA', borderRadius: '12px', background: '#fff', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', color: '#666' }}>취소</button>
              <button onClick={handleTransferCrew} disabled={transferring} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg,#FFD700,#FFA000)', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', color: '#1c1c1e' }}>
                {transferring ? '처리 중...' : '위임하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 ── */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: `calc(36px * var(--fs, 1))`, marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', color: '#FF3B30', marginBottom: '8px' }}>크루를 삭제할까요?</div>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#aaa', marginBottom: '24px' }}>삭제된 크루와 채팅 기록은 복구할 수 없습니다.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '13px', border: '1.5px solid #E5E5EA', borderRadius: '12px', background: '#fff', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', color: '#666' }}>취소</button>
              <button onClick={handleDeleteCrew} disabled={deletingCrew} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '12px', background: '#FF3B30', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', color: '#fff' }}>
                {deletingCrew ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
