import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Waves, Wind, Anchor, ChevronLeft, Droplets, Share2, Trash2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import LoadingSpinner from '../components/LoadingSpinner';
import { shareExternal } from '../utils/shareUtils';

const PLAY_STORE_URL = 'https://play.google.com/apps/internaltest/4701312289208373704';
const APP_ID = 'kr.fishinggo.app';

// ✅ APP-BANNER: 모바일 브라우저 접근 시 앱 설치 유도 배너
function AppInstallBanner({ catchId }) {
  const [visible, setVisible] = React.useState(true);
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isNative || !isAndroid || !visible) return null;

  const handleOpen = () => {
    const intentUrl = `intent://catch?catchId=${catchId}#Intent;scheme=fishinggo;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
    window.location.href = intentUrl;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: 'linear-gradient(135deg, #0B1F3A, #0056D2)',
      padding: '10px 14px',
    }}>
      <img src="/og-image.png" alt="낚시GO" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>낚시GO 앱에서 보기</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>앱에서 더 편리하게 확인하세요!</div>
      </div>
      <button onClick={handleOpen} style={{ flexShrink: 0, background: '#FEE500', border: 'none', borderRadius: '10px', padding: '7px 13px', fontSize: '12px', fontWeight: '900', color: '#191919', cursor: 'pointer' }}>앱 열기</button>
      <button onClick={() => setVisible(false)} style={{ flexShrink: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
    </div>
  );
}

// ✅ 2ND-C1: 날짜 포맷 IIFE JSX → 유틸 함수로 추출 — 가독성 향상
const formatDate = (raw) => {
  try {
    return new Date(raw).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return raw || ''; }
};



export default function CatchDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const addToast = useToastStore(s => s.addToast);
  const user = useUserStore(s => s.user); // ✅ DELETE: 내 기록 확인용

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.get(`/api/records/${id}`)
      .then(res => setRecord(res.data))
      .catch((err) => {
        setRecord(null);
        const status = err.response?.status;
        if (status === 404) {
          addToast('해당 조과 기록을 찾을 수 없습니다.', 'error');
        } else {
          addToast('데이터를 불러오지 못했습니다. 네트워크를 확인해주세요.', 'error');
        }
      })
      .finally(() => setLoading(false));
    // ✅ 2ND-B2: addToast deps 추가 — eslint exhaustive-deps 안정
  }, [id, addToast]);


  // ✅ SHARE-EXT: catchId 파라미터 추가 + 사진 있으면 표시, 없으면 앱 로고
  const handleShare = useCallback(async () => {
    await shareExternal({
      title: `${record?.fish || record?.species || '조과'} 낚시 기록 | 낚시GO`,
      text:  record?.content?.slice(0, 80) || '낚시GO에서 조과 기록을 확인하세요!',
      url:   window.location.href,
      imgUrl: record?.image || null, // null이면 shareUtils에서 앱 로고로 대체
      addToast,
      catchId: id,
    });
  }, [record?.fish, record?.species, record?.content, record?.image, addToast, id]);

  // ✅ DELETE: 내 기록 삭제
  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/user/records/${id}`, { data: { email: user?.email } });
      addToast('해당 조과 기록을 삭제했습니다.', 'success');
      // 뒤로가기 (마이페이지 조과 스크롤로)
      if (window.history.length <= 1) navigate('/', { replace: true });
      else navigate(-1);
    } catch (err) {
      addToast(err.response?.data?.error || '삭제에 실패했습니다.', 'error');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }, [id, user?.email, addToast, navigate]);

  // 내 기록인지 확인
  const isMyRecord = record && user && (
    record.author_email === user.email ||
    record.userId === user.id ||
    record.email === user.email
  );

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', zIndex: 2000 }}>
      {/* ✅ APP-BANNER: 모바일 브라우저 접근 시 앱 설치 유도 */}
      <AppInstallBanner catchId={id} />
      <div style={{ padding: '16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
        <button onClick={() => window.history.length <= 1 ? navigate('/', { replace: true }) : navigate(-1)} style={{ border: 'none', background: 'none', padding: '8px' }}>
          <ChevronLeft size={24} color="#1c1c1e" />
        </button>
        <h2 style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '800', flex: 1, textAlign: 'center', marginRight: '40px' }}>나의 조과 기록</h2>
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100dvh - 57px - env(safe-area-inset-top, 0px))' }}>
        {loading ? (
          // ENH5-A6: 인라인 spinner → 공통 LoadingSpinner 컴포넌트로 통일
          <LoadingSpinner style={{ height: '50vh' }} />
        ) : !record ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
            <div style={{ fontSize: `calc(48px * var(--fs, 1))` }}>🎣</div>
            <p style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e' }}>기록을 찾을 수 없습니다</p>
            <button onClick={() => window.history.length <= 1 ? navigate('/', { replace: true }) : navigate(-1)} style={{ padding: '12px 24px', background: '#0056D2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}>
              돌아가기
            </button>
          </div>
        ) : (
          <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)' }}>
            {/* ENH-A1: blur placeholder — 로드 전 흐린 상태 → 로드 완료 시 선명 전환 */}
            {record.image && (
              <img
                src={record.image}
                alt="catch"
                loading="lazy"
                style={{
                  width: '100%', height: '300px', objectFit: 'cover',
                  filter: 'blur(8px)', transition: 'filter 0.4s ease',
                }}
                onLoad={e => { e.target.style.filter = 'none'; }}
              />
            )}
            <div style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0056D2', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', marginBottom: '4px' }}>
                    <Calendar size={14} />
                    {/* ✅ 2ND-C1: formatDate 유틸 사용 — JSX 내 IIFE 제거 */}
                    {formatDate(record.date || record.createdAt)} {record.time && `(${record.time})`}
                  </div>
                  <h1 style={{ fontSize: `calc(24px * var(--fs, 1))`, fontWeight: '800', margin: 0 }}>
                    {/* ENH5-B6: record.fish는 구형 데이터 하위 호환용 — DB 마이그레이션 완료 시 species만 사용 가능 */}
                    {record.fish || record.species || '어종 미상'} {record.size && record.size}
                  </h1>
                </div>
                {record.weight && (
                  <div style={{ backgroundColor: '#f0f5ff', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#0056D2', fontWeight: '800', marginBottom: '2px' }}>무게</div>
                    <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '800', color: '#0056D2' }}>{record.weight}</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {record.location && (
                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93', fontSize: `calc(12px * var(--fs, 1))`, marginBottom: '6px' }}>
                      <MapPin size={14} /> 낚시 장소
                    </div>
                    <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>{record.location}</div>
                  </div>
                )}
                {record.gear && (
                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93', fontSize: `calc(12px * var(--fs, 1))`, marginBottom: '6px' }}>
                      <Anchor size={14} /> 사용 채비
                    </div>
                    <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', lineHeight: '1.4' }}>{record.gear}</div>
                  </div>
                )}
              </div>

              {(record.weather || record.wind || record.wave) && (
                <div style={{ borderTop: '1px solid #f0f0f0', padding: '24px 0' }}>
                  <h3 style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '800', marginBottom: '16px' }}>당시 기상 실황</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px', backgroundColor: '#fdfdff', border: '1px solid #ebf1ff', borderRadius: '16px' }}>
                    {record.weather && (
                      <div style={{ textAlign: 'center' }}>
                        <Droplets size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#999' }}>날씨</div>
                        <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>{record.weather}</div>
                      </div>
                    )}
                    {record.wind && (
                      <div style={{ textAlign: 'center' }}>
                        <Wind size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#999' }}>풍속</div>
                        <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>{record.wind}</div>
                      </div>
                    )}
                    {record.wave && (
                      <div style={{ textAlign: 'center' }}>
                        <Waves size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#999' }}>파고</div>
                        <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>{record.wave}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {record.content && (
                <div style={{ borderTop: '1px solid #f0f0f0', padding: '24px 0' }}>
                  <h3 style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '800', marginBottom: '12px' }}>낚시 메모</h3>
                  <p style={{ fontSize: `calc(15px * var(--fs, 1))`, lineHeight: '1.7', color: '#444', margin: 0 }}>{record.content}</p>
                </div>
              )}

              {/* ―― 버튼 그룹: 공유 + (내 기록이면) 삭제 ―― */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={handleShare}
                  style={{ flex: 1, padding: '18px', borderRadius: '16px', border: '1.5px solid #0056D2', color: '#0056D2', background: '#fff', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Share2 size={18} /> 이 기록 공유하기
                </button>
                {isMyRecord && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{ padding: '18px 20px', borderRadius: '16px', border: '1.5px solid #FF3B30', color: '#FF3B30', background: '#FFF0F0', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0 }}
                  >
                    <Trash2 size={18} /> 삭제
                  </button>
                )}
              </div>

              {/* ―― 삭제 확인 모달 ―― */}
              {showDeleteConfirm && (
                <div
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                >
                  <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '320px', background: '#fff', borderRadius: '24px', padding: '28px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: `calc(40px * var(--fs, 1))`, marginBottom: '12px' }}>🗑️</div>
                    <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e', marginBottom: '8px' }}>조과 기록을 삭제하시겠어요?</div>
                    <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', marginBottom: '24px', lineHeight: '1.5' }}>삭제하면 복구할 수 없습니다.</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        style={{ flex: 1, padding: '14px', border: '1.5px solid #E5E5EA', borderRadius: '14px', background: '#fff', fontWeight: '800', fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer', color: '#1c1c1e' }}
                      >취소</button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '14px', background: deleting ? '#E5E5EA' : '#FF3B30', color: deleting ? '#AEAEB2' : '#fff', fontWeight: '900', fontSize: `calc(14px * var(--fs, 1))`, cursor: deleting ? 'not-allowed' : 'pointer' }}
                      >{deleting ? '삭제 중...' : '삭제'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* ENH5-A6: 중복 @keyframes style 태그 제거 — index.css의 전역 spin 키프레임 사용 */}
    </div>
  );
}
