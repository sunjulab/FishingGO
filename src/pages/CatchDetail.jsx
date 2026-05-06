import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Waves, Wind, Anchor, ChevronLeft, Droplets, Share2 } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import LoadingSpinner from '../components/LoadingSpinner';

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

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [id, addToast]); // ✅ 15TH-C2: eslint-disable 불필요 주석 제거 (id, addToast 모두 deps에 포함됨)


  // ✅ 2ND-B1: useCallback 적용 — PostDetail과 동일 패턴, 매 렌더마다 함수 재생성 방지
  const handleShare = useCallback(async () => {
    const title = `${record?.fish || record?.species || '조과'} 낚시 기록 | 낚시GO`;
    const text = record?.content?.slice(0, 80) || '낚시GO에서 조과 기록을 확인하세요!';
    const pageUrl = window.location.href;
    const imgUrl = record?.image?.startsWith('http')
      ? record.image
      : `${window.location.origin}/og-image.png`;

    // ① 카카오 공유 (SDK 초기화 완료 시 우선)
    if (window.Kakao?.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title,
            description: text,
            imageUrl: imgUrl,
            link: { mobileWebUrl: pageUrl, webUrl: pageUrl },
          },
          buttons: [{ title: '조과 보러가기', link: { mobileWebUrl: pageUrl, webUrl: pageUrl } }],
        });
        return;
      } catch (e) { /* 카카오 실패 시 폴백 */ }
    }
    // ② Web Share API
    if (navigator.share) {
      try { await navigator.share({ title, text, url: pageUrl }); return; }
      catch (e) { /* 취소 무시 */ }
    }
    // ③ 클립보드 복사 폴백
    try {
      await navigator.clipboard.writeText(pageUrl);
      addToast('🔗 링크가 클립보드에 복사되었습니다!', 'success');
    } catch {
      addToast('링크 복사에 실패했습니다.', 'error');
    }
  }, [record?.fish, record?.species, record?.content, record?.image, addToast]);

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', zIndex: 2000 }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', padding: '8px' }}>
          <ChevronLeft size={24} color="#1c1c1e" />
        </button>
        <h2 style={{ fontSize: '17px', fontWeight: '800', flex: 1, textAlign: 'center', marginRight: '40px' }}>나의 조과 기록</h2>
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100dvh - 57px)' }}>
        {loading ? (
          // ENH5-A6: 인라인 spinner → 공통 LoadingSpinner 컴포넌트로 통일
          <LoadingSpinner style={{ height: '50vh' }} />
        ) : !record ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>🎣</div>
            <p style={{ fontSize: '16px', fontWeight: '800', color: '#1c1c1e' }}>기록을 찾을 수 없습니다</p>
            <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', background: '#0056D2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}>
              돌아가기
            </button>
          </div>
        ) : (
          <div style={{ paddingBottom: '40px' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0056D2', fontSize: '13px', fontWeight: '800', marginBottom: '4px' }}>
                    <Calendar size={14} />
                    {/* ✅ 2ND-C1: formatDate 유틸 사용 — JSX 내 IIFE 제거 */}
                    {formatDate(record.date || record.createdAt)} {record.time && `(${record.time})`}
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                    {/* ENH5-B6: record.fish는 구형 데이터 하위 호환용 — DB 마이그레이션 완료 시 species만 사용 가능 */}
                    {record.fish || record.species || '어종 미상'} {record.size && record.size}
                  </h1>
                </div>
                {record.weight && (
                  <div style={{ backgroundColor: '#f0f5ff', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#0056D2', fontWeight: '800', marginBottom: '2px' }}>무게</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0056D2' }}>{record.weight}</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {record.location && (
                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93', fontSize: '12px', marginBottom: '6px' }}>
                      <MapPin size={14} /> 낚시 장소
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{record.location}</div>
                  </div>
                )}
                {record.gear && (
                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93', fontSize: '12px', marginBottom: '6px' }}>
                      <Anchor size={14} /> 사용 채비
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', lineHeight: '1.4' }}>{record.gear}</div>
                  </div>
                )}
              </div>

              {(record.weather || record.wind || record.wave) && (
                <div style={{ borderTop: '1px solid #f0f0f0', padding: '24px 0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>당시 기상 실황</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px', backgroundColor: '#fdfdff', border: '1px solid #ebf1ff', borderRadius: '16px' }}>
                    {record.weather && (
                      <div style={{ textAlign: 'center' }}>
                        <Droplets size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '11px', color: '#999' }}>날씨</div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{record.weather}</div>
                      </div>
                    )}
                    {record.wind && (
                      <div style={{ textAlign: 'center' }}>
                        <Wind size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '11px', color: '#999' }}>풍속</div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{record.wind}</div>
                      </div>
                    )}
                    {record.wave && (
                      <div style={{ textAlign: 'center' }}>
                        <Waves size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '11px', color: '#999' }}>파고</div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{record.wave}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {record.content && (
                <div style={{ borderTop: '1px solid #f0f0f0', padding: '24px 0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px' }}>낚시 메모</h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#444', margin: 0 }}>{record.content}</p>
                </div>
              )}

              <button
                onClick={handleShare}
                style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid #0056D2', color: '#0056D2', background: '#fff', fontSize: '15px', fontWeight: '800', marginTop: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Share2 size={18} /> 이 기록 공유하기
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ENH5-A6: 중복 @keyframes style 태그 제거 — index.css의 전역 spin 키프레임 사용 */}
    </div>
  );
}
