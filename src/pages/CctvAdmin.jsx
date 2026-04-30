import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { Tv, Edit3, Check, X, RotateCcw, ArrowLeft, Youtube, Image, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

import apiClient from '../api/index';

const REGION_COLORS = {
  '강원': '#1565C0',
  '경북': '#6A1B9A',
  '경남': '#2E7D32',
  '부산': '#E65100',
  '전남': '#00838F',
  '전북': '#4E342E',
  '충남': '#37474F',
  '제주': '#FF6F00',
};

export default function CctvAdmin() {
  const navigate = useNavigate();
  const isAdmin = useUserStore(s => s.isAdmin?.() ?? false);
  const addToast = useToastStore(s => s.addToast);

  const [cctvList, setCctvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCode, setEditingCode] = useState(null);
  const [editValues, setEditValues] = useState({ youtubeId: '', type: 'youtube', label: '' });
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, danger, onConfirm }
  const [saving,       setSaving]       = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const [previewCode,  setPreviewCode]  = useState(null);

  // 마스터 권한 체크
  useEffect(() => {
    if (!isAdmin) {
      navigate('/mypage');
    }
  }, [isAdmin]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/cctv');
      setCctvList(res.data.list || []);
    } catch (err) {
      addToast('CCTV \ubaa9\ub85d \ubd88\ub7ec\uc624\uae30 \uc2e4\ud328', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const startEdit = (item) => {
    setEditingCode(item.obsCode);
    setEditValues({
      youtubeId: item.youtubeId || '',
      type: item.type || 'youtube',
      label: item.label || '',
    });
    setPreviewCode(null);
  };

  const cancelEdit = () => {
    setEditingCode(null);
    setEditValues({ youtubeId: '', type: 'youtube', label: '' });
  };

  const saveEdit = async (obsCode) => {
    try {
      setSaving(true);
      const body = { ...editValues };

      // URL 파싱 로직 추가 (전체 주소가 들어오더라도 11자리 ID만 저장)
      if (body.type === 'youtube' && body.youtubeId) {
        const extractYoutubeId = (str) => {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = str.match(regExp);
          return (match && match[2].length === 11) ? match[2] : str;
        };
        body.youtubeId = extractYoutubeId(body.youtubeId.trim());
      } else if (body.type === 'image') {
        body.youtubeId = '';
      }

      const res = await apiClient.put(`/api/admin/cctv/${obsCode}`, body);
      const data = res.data;
      if (data.success) {
        addToast(`✅ ${obsCode} 저장 완료!`, 'success');
        cancelEdit();
        fetchList();
      } else {
        addToast('저장 실패', 'error');
      }
    } catch {
      addToast('네트워크 오류', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetOverride = (obsCode) => {
    setConfirmModal({
      title: '기본값으로 복원',
      message: `${obsCode}의 설정을 초기화하고\n기본 해양수산부(MOF) 영상으로 복원할까요?`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/admin/cctv/${obsCode}`);
          addToast(`${obsCode} 기본값으로 복원됨`, 'success');
          fetchList();
        } catch {
          addToast('초기화 실패', 'error');
        }
      },
    });
  };

  const autoSyncCctvs = () => {
    setConfirmModal({
      title: 'YouTube 자동 갱신',
      message: `유튜브 API를 사용하여 모든 지역의 라이브 URL을 최신화합니다.\nYouTube Data API 쿼터가 소모됩니다. 계속할까요?`,
      onConfirm: async () => {
        try {
          setSyncing(true);
          const res = await apiClient.post('/api/admin/cctv/auto-sync', {});
          const data = res.data;
          if (data.success) {
            addToast(`✅ ${data.updatedCount}개 지역 실시간 영상 갱신 완료!`, 'success');
            fetchList();
          } else {
            addToast(data.error || '자동 동기화에 실패했습니다.', 'error');
          }
        } catch {
          addToast('네트워크 오류', 'error');
        } finally {
          setSyncing(false);
        }
      },
    });
  };

  const handleResetAll = () => {
    setConfirmModal({
      title: '⚠️ 전체 설정 초기화',
      message: `모든 사용자 지정 CCTV 설정을 삭제하고\n해양수산부(MOF) 기본값으로 복원합니다.\n\n이 작업은 되돌릴 수 없습니다.`,
      danger: true,
      onConfirm: async () => {
        try {
          const res = await apiClient.post('/api/admin/cctv/reset-all', {});
          const data = res.data;
          if (data.success) {
            addToast(data.message, 'success');
            fetchList();
          } else {
            addToast(data.error || '초기화 실패', 'error');
          }
        } catch {
          addToast('서버 오류로 초기화 실패', 'error');
        }
      },
    });
  };

  const getEmbedUrl = (youtubeId) =>
    `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=1`;

  if (!isAdmin) return null;

  return (
    <div className="page-container" style={{ backgroundColor: '#0A0F1C', minHeight: '100vh', paddingBottom: '40px' }}>

      {/* ── 커스텀 확인 모달 ── */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{
            backgroundColor: '#141824', borderRadius: '24px', padding: '28px 24px',
            width: '100%', maxWidth: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            border: `1.5px solid ${confirmModal.danger ? 'rgba(255,59,48,0.4)' : 'rgba(255,215,0,0.25)'}`,
          }}>
            <div style={{ fontSize: '18px', fontWeight: '950', color: '#fff', marginBottom: '12px' }}>
              {confirmModal.title}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', whiteSpace: 'pre-line', marginBottom: '24px' }}>
              {confirmModal.message}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '14px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={() => { setConfirmModal(null); confirmModal.onConfirm(); }}
                style={{
                  flex: 1.5, padding: '13px', border: 'none', borderRadius: '14px',
                  background: confirmModal.danger
                    ? 'linear-gradient(135deg, #FF3B30, #C0392B)'
                    : 'linear-gradient(135deg, #FFD700, #FFA000)',
                  color: confirmModal.danger ? '#fff' : '#1A1A2E',
                  fontSize: '14px', fontWeight: '900', cursor: 'pointer',
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={() => navigate('/mypage')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
        <div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '0.08em' }}>MASTER ONLY</div>
          <div style={{ fontSize: '18px', fontWeight: '950', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tv size={18} color="#FFD700" /> CCTV 채널 관리
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
          {cctvList.filter(c => c.isOverride).length}개 커스텀 / {cctvList.length}개 전체
        </div>
      </div>

      {/* 안내 배너 */}
      <div style={{ margin: '16px 16px 0', padding: '14px 16px', background: 'rgba(255,215,0,0.08)', borderRadius: '16px', border: '1px solid rgba(255,215,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: '900', color: '#FFD700' }}>📺 사용 방법</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleResetAll} style={{ background: 'rgba(255,100,100,0.2)', border: '1px solid rgba(255,100,100,0.5)', color: '#FF7B7B', borderRadius: '12px', padding: '6px 12px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={12} /> 설정 초기화(MOF)
            </button>
            <button onClick={autoSyncCctvs} disabled={syncing} style={{ background: 'linear-gradient(135deg, #00C48C, #0056D2)', color: '#fff', border: 'none', borderRadius: '12px', padding: '6px 12px', fontSize: '10px', fontWeight: '800', cursor: syncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: syncing ? 0.7 : 1 }}>
              <Youtube size={12} className={syncing ? 'spin' : ''} /> {syncing ? '탐색 중...' : '자동 갱신'}
            </button>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
          YouTube 라이브 URL에서 <span style={{ color: '#FFD700', fontWeight: '800' }}>영상 ID(11자리)</span>만 복사하여 입력하세요.<br />
          예: youtube.com/watch?v=<span style={{ color: '#FFD700' }}>iCGFbFulG3Y</span> → <span style={{ color: '#FFD700' }}>iCGFbFulG3Y</span> 입력
        </div>
      </div>

      {/* 목록 */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>불러오는 중...</div>
        ) : cctvList.map((item) => {
          const isEditing = editingCode === item.obsCode;
          const isPreviewing = previewCode === item.obsCode;
          const regionColor = REGION_COLORS[item.region] || '#555';

          return (
            <div key={item.obsCode} style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '20px',
              marginBottom: '12px',
              border: isEditing ? '1.5px solid #FFD700' : item.isOverride ? '1.5px solid rgba(100,220,100,0.4)' : '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              transition: 'border 0.2s',
            }}>
              {/* 카드 헤더 */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: regionColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.type === 'youtube' ? <Youtube size={16} color="#fff" /> : <Image size={16} color="#fff" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>{item.areaName}</span>
                    {item.isOverride && (
                      <span style={{ fontSize: '9px', fontWeight: '900', background: 'rgba(100,220,100,0.2)', color: '#64DC64', padding: '2px 6px', borderRadius: '6px' }}>수정됨</span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                    {item.obsCode} · {item.region} ·
                    <span style={{ color: item.type === 'youtube' ? '#FF6B6B' : '#64B5F6', marginLeft: '4px' }}>
                      {item.type === 'youtube' ? '▶ YouTube' : '🖼 이미지'}
                    </span>
                  </div>
                  {item.youtubeId && !isEditing && (
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: '600', fontFamily: 'monospace', marginTop: '2px' }}>
                      ID: {item.youtubeId}
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                {!isEditing && (
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {item.youtubeId && (
                      <button
                        onClick={() => setPreviewCode(isPreviewing ? null : item.obsCode)}
                        style={{ background: 'rgba(255,107,107,0.15)', border: 'none', borderRadius: '10px', padding: '6px 10px', color: '#FF6B6B', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {isPreviewing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        미리보기
                      </button>
                    )}
                    {item.isOverride && (
                      <button onClick={() => resetOverride(item.obsCode)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', padding: '6px 10px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <RotateCcw size={13} />
                      </button>
                    )}
                    <button onClick={() => startEdit(item)} style={{ background: 'rgba(255,215,0,0.15)', border: 'none', borderRadius: '10px', padding: '6px 12px', color: '#FFD700', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Edit3 size={12} /> 수정
                    </button>
                  </div>
                )}
              </div>

              {/* 미리보기 패널 */}
              {isPreviewing && item.youtubeId && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
                    <iframe
                      src={getEmbedUrl(item.youtubeId)}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    />
                  </div>
                </div>
              )}

              {/* 편집 패널 */}
              {isEditing && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,215,0,0.15)' }}>
                  {/* 타입 선택 */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', marginTop: '14px' }}>
                    {['youtube', 'image'].map(t => (
                      <button key={t} onClick={() => setEditValues(v => ({ ...v, type: t }))} style={{
                        flex: 1, padding: '10px', background: editValues.type === t ? (t === 'youtube' ? 'rgba(255,107,107,0.2)' : 'rgba(100,181,246,0.2)') : 'rgba(255,255,255,0.04)',
                        border: editValues.type === t ? `1.5px solid ${t === 'youtube' ? '#FF6B6B' : '#64B5F6'}` : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', color: editValues.type === t ? (t === 'youtube' ? '#FF6B6B' : '#64B5F6') : 'rgba(255,255,255,0.4)',
                        fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}>
                        {t === 'youtube' ? <Youtube size={13} /> : <Image size={13} />}
                        {t === 'youtube' ? 'YouTube 라이브' : '이미지 방식'}
                      </button>
                    ))}
                  </div>

                  {/* YouTube ID 입력 */}
                  {editValues.type === 'youtube' && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', marginBottom: '6px', display: 'block' }}>
                        YouTube 영상 ID (URL의 ?v= 뒤 11자리)
                      </label>
                      <input
                        value={editValues.youtubeId}
                        onChange={e => setEditValues(v => ({ ...v, youtubeId: e.target.value.trim() }))}
                        placeholder="예: iCGFbFulG3Y"
                        style={{
                          width: '100%', padding: '12px 14px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: '700',
                          outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box'
                        }}
                      />
                      {editValues.youtubeId && (
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                          미리보기: youtube.com/watch?v={editValues.youtubeId}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 라벨 입력 */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', marginBottom: '6px', display: 'block' }}>
                      표시 레이블 (선택)
                    </label>
                    <input
                      value={editValues.label}
                      onChange={e => setEditValues(v => ({ ...v, label: e.target.value }))}
                      placeholder={`기본: ${item.label}`}
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: '700',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 저장/취소 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={cancelEdit} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <X size={14} /> 취소
                    </button>
                    <button onClick={() => saveEdit(item.obsCode)} disabled={saving} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', border: 'none', borderRadius: '12px', color: '#1A1A2E', fontSize: '13px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}>
                      <Check size={14} /> {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
