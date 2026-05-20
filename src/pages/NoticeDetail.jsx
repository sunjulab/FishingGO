import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Edit2, Trash2, Bell, Calendar, Eye, Share2, Send, X as XIcon } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageGallery from '../components/ImageGallery';
import { io } from 'socket.io-client';
import { shareExternal } from '../utils/shareUtils';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function NoticeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);

  // navigate state로 넘어온 데이터 우선 사용
  const [notice, setNotice] = useState(location.state?.notice || null);
  const [loading, setLoading] = useState(!location.state?.notice);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // ✅ SHARE
  const [shareModal, setShareModal] = useState(false);
  const [myCrews, setMyCrews] = useState([]);
  const [shareTarget, setShareTarget] = useState(null);
  const [sharing, setSharing] = useState(false);
  const shareSockets = useRef({});

  // ✅ 11TH-A2: state.isAdmin() 셉렉터 → ADMIN_ID/EMAIL 직접 비교 (3RD-A2 표준으로 통일)
  const isAdmin = useUserStore((state) =>
    state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL
  );

  // ✅ 23TH-C4: fetchNotice를 useCallback으로 감싸 — eslint-disable 없이 useEffect deps에 안전하게 포함 가능
  const fetchNotice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/community/notices/${id}`);
      setNotice(res.data);
    } catch (err) {
      // NEW-A4: 프로덕션에서 콘솔 스택 트레이스 노출 방지
      if (!import.meta.env.PROD) console.error('Notice fetch error:', err.response?.status, err.message);
      addToast('공지사항을 불러올 수 없습니다.', 'error');
      // ENH5-B5: setTimeout 딜레이 제거 → 즉시 navigate (더 나은 UX)
      navigate('/community?tab=notice', { replace: true });
    } finally { setLoading(false); }
  }, [id, addToast, navigate]);

  useEffect(() => {
    if (location.state?.notice) return;
    fetchNotice();
  }, [fetchNotice, location.state?.notice]);

  // ✅ SHARE-SOCKET-CLEANUP: 언마운트 시 캐시된 공유 소켓 전체 해제
  useEffect(() => {
    return () => {
      Object.values(shareSockets.current).forEach(s => {
        try { s.disconnect(); } catch { }
      });
      shareSockets.current = {};
    };
  }, []);

  // ✅ EDIT-FULL: 인라인 모달 → WritePost 전체화면 수정으로 교체
  const handleEditNavigate = () => {
    navigate(`/write?type=notice&editId=${id}`);
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/community/notices/${id}`);
      addToast('공지사항이 삭제되었습니다.', 'success');
      navigate('/community?tab=notice');
    } catch (err) {
      addToast(err.response?.data?.error || '삭제 실패', 'error');
    }
  };

  // ✅ 11TH-C2: 인라인 border 스피너 → LoadingSpinner 컴포넌트 교체
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fff', gap: '12px' }}>
      <LoadingSpinner />
      <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>로드 중...</span>
    </div>
  );

  if (!notice) return null;

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100dvh' }}>
      {/* 헤더 — ✅ SAFE-AREA: 상단 상태바 자동 회피 */}
      <div style={{ backgroundColor: '#fff', padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => window.history.length <= 1 ? navigate('/community?tab=notice', { replace: true }) : navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', color: '#1c1c1e' }}>
          <ChevronLeft size={26} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={17} color="#FF3B30" />
          <span style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}>공지사항</span>
        </div>
        {isAdmin ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleEditNavigate}
              style={{ background: 'rgba(0,86,210,0.08)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: '#0056D2', fontWeight: '800', fontSize: `calc(14px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Edit2 size={14} /> 수정
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ background: 'rgba(255,59,48,0.08)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: '#FF3B30', fontWeight: '800', fontSize: `calc(14px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            {/* ✅ 외부 앱 공유 버튼 */}
            <button
              onClick={() => shareExternal({
                title: `[공지] ${notice?.title || ''} | 낚시GO`,
                text:  (notice?.content || '').slice(0, 80),
                url:   window.location.href,
                addToast,
              })}
              style={{ background: 'rgba(0,86,210,0.08)', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#0056D2', fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Share2 size={14} /> 공유
            </button>
            {/* ✅ 크루 체팅방 공유 버튼 */}
            <button
              onClick={async () => {
                if (!user) { addToast('로그인 후 이용하세요.', 'error'); return; }
                try {
                  const res = await apiClient.get('/api/user/crews');
                  setMyCrews(Array.isArray(res.data) ? res.data : []);
                } catch { setMyCrews([]); }
                setShareTarget(null);
                setShareModal(true);
              }}
              style={{ background: 'rgba(0,86,210,0.08)', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#0056D2', fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              💬 크루
            </button>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div style={{ padding: '28px 24px' }}>
        {/* 상단 배지 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          {notice.isPinned && (
            <span style={{ padding: '5px 12px', backgroundColor: '#FF3B30', color: '#fff', fontSize: `calc(12px * var(--fs, 1))`, borderRadius: '10px', fontWeight: '900' }}>📌 필독</span>
          )}
          <span style={{ padding: '5px 12px', backgroundColor: '#FFF1F0', color: '#FF3B30', fontSize: `calc(12px * var(--fs, 1))`, borderRadius: '10px', fontWeight: '900', border: '1px solid #FFCCC7' }}>공지</span>
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: `calc(26px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e', lineHeight: '1.4', marginBottom: '20px', wordBreak: 'keep-all' }}>
          {notice.title}
        </h1>

        {/* 메타 정보 */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '2px solid #F2F2F7', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: `calc(14px * var(--fs, 1))` }}>
            <Calendar size={15} />
            <span>{notice.date || (notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('ko-KR') : '')}</span>
          </div>
          {notice.views != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: `calc(14px * var(--fs, 1))` }}>
              <Eye size={15} />
              <span>조회 {notice.views}</span>
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: `calc(13px * var(--fs, 1))`, color: '#bbb', fontWeight: '700' }}>
            낚시GO 운영팀
          </div>
        </div>

        {/* ✅ MULTI-IMG: 공지사항 다중 이미지 갤러리 (images 배열 우선, image 단일 필드 하위호환) */}
        {(Array.isArray(notice.images) && notice.images.length > 0) || notice.image ? (
          <ImageGallery
            images={notice.images}
            image={notice.image}
            maxHeight={400}
            borderRadius="16px"
            showZoom={true}
          />
        ) : null}

        {/* 본문 내용 */}
        <div style={{ fontSize: `calc(17px * var(--fs, 1))`, color: '#222', lineHeight: '1.9', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '200px' }}>
          {notice.content}
        </div>
      </div>

      {/* 목록으로 버튼 */}
      <div style={{ padding: '0 24px 48px' }}>
        <button
          onClick={() => navigate('/community?tab=notice')}
          style={{ width: '100%', padding: '16px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '16px', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#555', cursor: 'pointer' }}
        >
          ← 목록으로
        </button>
      </div>


      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <div style={{ fontSize: `calc(40px * var(--fs, 1))`, marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '900', marginBottom: '8px' }}>공지사항 삭제</h3>
            <p style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#666', marginBottom: '24px' }}>이 공지사항을 삭제하시겠습니까?<br />삭제 후 복구할 수 없습니다.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #E5E5EA', background: '#fff', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}>취소</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#FF3B30', color: '#fff', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer' }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SHARE-MODAL: 공지 → 크루 채팅방 공유 */}
      {shareModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShareModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', boxShadow: '0 -8px 32px rgba(0,0,0,0.18)', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}>📢 크루 채팅방에 공유</span>
              <button onClick={() => setShareModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XIcon size={20} color="#8e8e93" /></button>
            </div>
            {/* 미리보기 */}
            <div style={{ background: '#FFF5F5', borderRadius: '14px', padding: '12px 14px', marginBottom: '16px', border: '1px solid #FFD6D6' }}>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#FF3B30', fontWeight: '900', marginBottom: '4px' }}>📢 공지사항</div>
              <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e' }}>{notice.title}</div>
              <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#888', marginTop: '4px' }}>{(notice.content || '').slice(0, 60)}</div>
            </div>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8e8e93', fontWeight: '700', marginBottom: '8px' }}>내가 속한 크루 ({myCrews.length})</div>
            {myCrews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontSize: `calc(14px * var(--fs, 1))` }}>가입된 크루가 없습니다.</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {myCrews.map(crew => {
                  const crewId = String(crew._id || crew.id);
                  const selected = String(shareTarget?._id || shareTarget?.id) === crewId;
                  return (
                    <div key={crewId} onClick={() => setShareTarget(crew)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', background: selected ? '#EEF4FF' : '#F8F9FA', border: selected ? '2px solid #0056D2' : '1.5px solid transparent' }}>
                      <span style={{ fontSize: `calc(24px * var(--fs, 1))` }}>{crew.emoji || '🎣'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', color: selected ? '#0056D2' : '#1c1c1e' }}>{crew.name}</div>
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8e8e93' }}>멤버 {crew.memberList?.length || crew.members || 0}명</div>
                      </div>
                      {selected && <span style={{ color: '#0056D2', fontWeight: '900' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              disabled={!shareTarget || sharing}
              onClick={async () => {
                if (!shareTarget || sharing) return;
                setSharing(true);
                const crewId = String(shareTarget._id || shareTarget.id);
                try {
                  if (!shareSockets.current[crewId] || !shareSockets.current[crewId].connected) {
                    let tok; try { tok = localStorage.getItem('access_token') || undefined; } catch { tok = undefined; }
                    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'], auth: { token: tok } });
                    shareSockets.current[crewId] = s;
                    await new Promise((res, rej) => {
                      const t = setTimeout(() => rej(new Error('연결 타임아웃')), 5000);
                      s.once('connect', () => { clearTimeout(t); res(); });
                      s.once('connect_error', (e) => { clearTimeout(t); rej(e); });
                    });
                    s.emit('join_crew', crewId);
                  }
                  shareSockets.current[crewId].emit('send_msg', {
                    crewId, type: 'post_share',
                    postId: String(notice._id || id),
                    postTitle: notice.title || '(제목 없음)',
                    postPreview: (notice.content || '').slice(0, 120),
                    postImage: notice.images?.[0] || notice.image || '',
                    postCategory: '📢 공지사항',
                  });
                  addToast(`✅ ${shareTarget.name} 채팅방에 공유했습니다!`, 'success');
                  setShareModal(false);
                } catch (err) {
                  if (shareSockets.current[crewId]) {
                    try { shareSockets.current[crewId].disconnect(); } catch { }
                    delete shareSockets.current[crewId];
                  }
                  addToast('공유에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
                }
                finally { setSharing(false); }
              }}
              style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '16px', background: (!shareTarget || sharing) ? '#E5E5EA' : 'linear-gradient(135deg,#FF3B30,#c0392b)', color: (!shareTarget || sharing) ? '#aaa' : '#fff', fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', cursor: (!shareTarget || sharing) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Send size={18} />
              {sharing ? '공유 중...' : shareTarget ? `${shareTarget.name}에 공유하기` : '크루를 선택하세요'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
