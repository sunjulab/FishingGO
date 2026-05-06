import React, { useState, useEffect, useCallback } from 'react'; // ✅ 23TH-C4: useCallback 추가
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Edit2, Trash2, Bell, Calendar, Eye } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore'; // ✅ 11TH-A2: ADMIN_ID/EMAIL import
import { useToastStore } from '../store/useToastStore';
import LoadingSpinner from '../components/LoadingSpinner'; // ✅ 11TH-C2: LoadingSpinner import

export default function NoticeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);

  // navigate state로 넘어온 데이터 우선 사용
  const [notice, setNotice] = useState(location.state?.notice || null);
  const [loading, setLoading] = useState(!location.state?.notice);
  // ✅ 2ND-B5: 수정 모달 state 4개 → 단일 객체 응집 (NEW-B7과 동일 패턴)
  const [editState, setEditState] = useState({ show: false, title: '', content: '', saving: false });
  const { show: showEditModal, title: editTitle, content: editContent, saving } = editState;
  const setShowEditModal = (v) => setEditState(s => ({ ...s, show: v }));
  const setEditTitle    = (v) => setEditState(s => ({ ...s, title: v }));
  const setEditContent  = (v) => setEditState(s => ({ ...s, content: v }));
  const setSaving       = (v) => setEditState(s => ({ ...s, saving: v }));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    // state로 데이터가 이미 있으면 API 호출 불필요
    if (location.state?.notice) return;
    fetchNotice();
    // ✅ 2ND-A5: location.state?.notice는 navigate 시점에 고정 — deps 제외 안전
    // ✅ 23TH-C4: fetchNotice가 useCallback으로 안정화되어 eslint-disable 없이 deps 포함
  }, [fetchNotice, location.state?.notice]);

  const handleEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) { addToast('제목과 내용을 입력해주세요.', 'error'); return; }
    setSaving(true);
    try {
      const res = await apiClient.put(`/api/community/notices/${id}`, {
        title: editTitle.trim(), content: editContent.trim()
      });
      setNotice(res.data);
      setShowEditModal(false);
      addToast('📢 공지사항이 수정되었습니다!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '수정 실패', 'error');
    } finally { setSaving(false); }
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
      <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '700' }}>로드 중...</span>
    </div>
  );

  if (!notice) return null;

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100dvh' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', color: '#1c1c1e' }}>
          <ChevronLeft size={26} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={17} color="#FF3B30" />
          <span style={{ fontSize: '17px', fontWeight: '900', color: '#1c1c1e' }}>공지사항</span>
        </div>
        {isAdmin ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setEditTitle(notice.title); setEditContent(notice.content); setShowEditModal(true); }}
              style={{ background: 'rgba(0,86,210,0.08)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: '#0056D2', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Edit2 size={14} /> 수정
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ background: 'rgba(255,59,48,0.08)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: '#FF3B30', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        ) : <div style={{ width: '70px' }} />}
      </div>

      {/* 본문 */}
      <div style={{ padding: '28px 24px' }}>
        {/* 상단 배지 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          {notice.isPinned && (
            <span style={{ padding: '5px 12px', backgroundColor: '#FF3B30', color: '#fff', fontSize: '12px', borderRadius: '10px', fontWeight: '900' }}>📌 필독</span>
          )}
          <span style={{ padding: '5px 12px', backgroundColor: '#FFF1F0', color: '#FF3B30', fontSize: '12px', borderRadius: '10px', fontWeight: '900', border: '1px solid #FFCCC7' }}>공지</span>
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: '26px', fontWeight: '950', color: '#1c1c1e', lineHeight: '1.4', marginBottom: '20px', wordBreak: 'keep-all' }}>
          {notice.title}
        </h1>

        {/* 메타 정보 */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '2px solid #F2F2F7', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '14px' }}>
            <Calendar size={15} />
            <span>{notice.date || (notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('ko-KR') : '')}</span>
          </div>
          {notice.views != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '14px' }}>
              <Eye size={15} />
              <span>조회 {notice.views}</span>
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#bbb', fontWeight: '700' }}>
            낚시GO 운영팀
          </div>
        </div>

        {/* 본문 내용 */}
        <div style={{ fontSize: '17px', color: '#222', lineHeight: '1.9', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '200px' }}>
          {notice.content}
        </div>
      </div>

      {/* 목록으로 버튼 */}
      <div style={{ padding: '0 24px 48px' }}>
        <button
          onClick={() => navigate('/community?tab=notice')}
          style={{ width: '100%', padding: '16px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '800', color: '#555', cursor: 'pointer' }}
        >
          ← 목록으로
        </button>
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '430px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>📢 공지사항 수정</h3>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="제목"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '15px', fontWeight: '700', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' }}
            />
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={6}
              placeholder="내용"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '15px', lineHeight: '1.6', resize: 'none', boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid #E5E5EA', background: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', color: '#555' }}>취소</button>
              <button onClick={handleEdit} disabled={saving} style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: '#0056D2', color: '#fff', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>
                {saving ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '8px' }}>공지사항 삭제</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>이 공지사항을 삭제하시겠습니까?<br />삭제 후 복구할 수 없습니다.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #E5E5EA', background: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>취소</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#FF3B30', color: '#fff', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
