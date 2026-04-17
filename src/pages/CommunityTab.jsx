import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Heart, Lock, Users, PlusCircle, Phone, Award, Trash2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { AD_CONFIG } from '../constants/adSettings';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import { NativeAd, BannerAd } from '../components/AdUnit';
export default function CommunityTab() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('business');
  
  const canAccessPremium = useUserStore((state) => state.canAccessPremium());
  const canAccessBusinessPromo = useUserStore((state) => state.canAccessBusinessPromo());
  const user = useUserStore((state) => state.user);
  const isAdmin = user?.id === 'sunjulab' || user?.email === 'sunjulab' || user?.name === 'sunjulab';
  
  const addToast = useToastStore((state) => state.addToast);
  const [posts, setPosts] = useState([
    { id: 'f1', author: '강릉감성돔', category: '찌낚시', time: '방금 전', content: '데이터 연동 중...', likes: 0, comments: 0 }
  ]);
  const [crews, setCrews] = useState([
    { id: 'CREW_001', name: '동해 무늬 사냥단', members: 42, isPrivate: true }
  ]);
  const [businessPosts, setBusinessPosts] = useState([
    { id: 'b3_vip', shipName: '남일호 VIP 크루즈', author: '남일해적선장', type: '선상/참돔', target: '참돔/방어', price: '인당 20만원', date: '이번 주 스페셜 야간', content: '👑 [VVIP 전용 배너] 특급 쉐프 승선, 초대형 넓은 갑판, 최고급 장비 100% 무상 렌탈.', likes: 832, comments: 142, cover: 'https://images.unsplash.com/photo-1544427920-549b6d60a5e5?auto=format&fit=crop&w=400&q=80', isPinned: true, expiresAt: null },
    { id: 'b1', shipName: '강릉 에이스호', author: '강릉에이스선장', type: '선상낚시', target: '대구/문어', price: '인당 12만원', date: '이번 주 주말 출항', content: '초보자 환영! 몸만 오시면 됩니다. 장비 대여 가능. 점심(문어라면) 제공!', likes: 12, comments: 4, cover: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?auto=format&fit=crop&w=400&q=80', isPinned: false },
    { id: 'b2', shipName: '인천 나이스호', author: '인천씨호크', type: '야간선상', target: '쭈꾸미/갑오징어', price: '인당 8만원', date: '매일 야간', content: '쭈꾸미 낚시 시즌 오픈! 최신 시설 완비, 깨끗한 화장실. 가족 단위 대환영.', likes: 45, comments: 18, cover: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=400&q=80', isPinned: false }
  ]);

  // VVIP 만료 실시간 체크: expiresAt 지나면 isPinned 자동 해제
  const effectiveBusinessPosts = useMemo(() => {
    const now = new Date();
    return businessPosts
      .map(post => {
        if (post.isPinned && post.expiresAt && new Date(post.expiresAt) < now) {
          return { ...post, isPinned: false, _expired: true };
        }
        return post;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [businessPosts]);

  const [noticePosts, setNoticePosts] = useState([
    { id: 'n1', author: 'Fishing GO 마스터', title: '🚨 커뮤니티 클린봇 가동 안내 (욕설 및 도배)', date: '2026.04.18', content: '투명하고 매너 있는 낚시 커뮤니티 문화를 위해 AI 클린봇이 24시간 감시 중입니다. 위반 시 경고 없이 영구 차단됩니다.', views: 1250, isPinned: true },
    { id: 'n2', author: 'Fishing GO 마스터', title: '🎁 전국 배스 낚시 챔피언십 온라인 대회 (총상금 1,000만 원)', date: '2026.04.15', content: '다음 주부터 앱 내 기록실을 통한 온라인 낚시 대회가 개막합니다! 많은 기대 부탁드립니다.', views: 800, isPinned: false },
    { id: 'n3', author: 'Fishing GO 마스터', title: '🚀 V1.5 유튜브 통합 검색 기능 오픈!', date: '2026.04.17', content: '낚시채널 탭에서 원하는 모든 낚시 유튜버의 영상을 검색하고, 실시간 쿠팡 파트너스 최저가 장비를 만나보세요.', views: 3410, isPinned: true }
  ]);
  const [loading, setLoading] = useState(true);

  // 1. 네이티브 피드 광고 (어그로성 외부 광고 -> 유익한 로컬 제휴 정보로 변경)
  const InFeedAd = () => (
    <div 
      onClick={() => addToast('제휴 낚시점 상세 페이지로 이동', 'info')}
      style={{ backgroundColor: '#F8F9FA', borderRadius: '16px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', border: '1px solid #E5E5EA' }}
    >
      <div style={{ width: '60px', height: '60px', backgroundColor: '#0056D2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Award size={24} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: '11px', color: '#0056D2', fontWeight: '900', marginBottom: '4px', display: 'inline-block', backgroundColor: 'rgba(0,86,210,0.1)', padding: '2px 8px', borderRadius: '6px' }}>가장 가까운 제휴 낚시점</div>
        <div style={{ fontSize: '15px', color: '#1c1c1e', fontWeight: '950', marginBottom: '4px' }}>동해 낚시 1번지 24시 할인마트</div>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '700' }}>현재 위치에서 2.4km (밑밥/미끼 상시 할인)</div>
      </div>
    </div>
  );

  // 2. 글쓰기/방만들기 권한 로직 (보상형 광고 및 방장 등급 체크)
  const handleFabClick = () => {
    if (activeTab === 'open') {
      if (!canAccessPremium) {
        if (AD_CONFIG.FREE_USER.SHOW_REWARD_AD_ON_POST) {
          navigate('/write');
        } else {
          const confirmed = window.confirm("💡 오늘의 대박 조과로 '메인 상단'에 고정 노출하시겠습니까?\n(15초 짧은 영상 광고 시청 시 상단 노출 버프 지급!)\n\n※ [취소]를 누르면 광고 없이 일반 글로 등록됩니다.");
          if (confirmed) {
            addToast("15초 시청 완료! 상단 노출 버프 상태로 이동합니다.", "success");
            navigate('/write?buff=true');
          } else {
            navigate('/write');
          }
        }
      } else {
        navigate('/write');
      }
    } else if (activeTab === 'crew') {
      if (!canAccessPremium) {
        addToast("무료(Free) 멤버쉽은 '크루 개설 방장 권한'이 없습니다. 업그레이드 후 이용해보세요!", "error");
      } else {
        navigate('/create-crew');
      }
    } else if (activeTab === 'business') {
      if (!canAccessBusinessPromo) {
        addToast('선상 홍보글은 PRO 또는 항구 독점 VVIP 보유자만 작성 가능합니다.', 'error');
        setTimeout(() => navigate('/vvip-subscribe'), 1500);
      } else {
        addToast('선장님 환영합니다! 및 비즈니스 홍보글을 작성합니다.', 'success');
        navigate('/write-business');
      }
    } else if (activeTab === 'notice') {
      if (!isAdmin) {
        addToast("❌ 공지사항은 Fishing GO 마스터(운영자)만 작성할 수 있습니다.", "error");
      } else {
        navigate('/write?type=notice');
      }
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postsRes, crewsRes] = await Promise.all([
          apiClient.get('/api/community/posts'),
          apiClient.get('/api/community/crews')
        ]);
        setPosts(postsRes.data);
        setCrews(crewsRes.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleDeletePost = async (e, id, type) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (window.confirm("정말 이 게시물을 삭제하시겠습니까? (운영자 권한)")) {
      try {
        await apiClient.delete(`/api/community/posts/${id}`);
        if (type === 'open') setPosts(posts.filter(p => p.id !== id));
        if (type === 'business') setBusinessPosts(businessPosts.filter(p => p.id !== id));
        if (type === 'notice') setNoticePosts(noticePosts.filter(p => p.id !== id));
        addToast("게시물이 삭제되었습니다.", "success");
      } catch (err) {
        // Fallback for UI if server is mock
        if (type === 'open') setPosts(posts.filter(p => p.id !== id));
        if (type === 'business') setBusinessPosts(businessPosts.filter(p => p.id !== id));
        if (type === 'notice') setNoticePosts(noticePosts.filter(p => p.id !== id));
        addToast("서버 오류이나, 강제로 삭제 처리했습니다 (UI 한정).", "success");
      }
    }
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#F2F2F7', paddingBottom: '100px' }}>
      {/* 프리미엄 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '24px 20px 0', borderBottom: '1px solid #F0F0F0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>커뮤니티</h1>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => setActiveTab('open')}
            style={{
              flex: 1, padding: '12px 0', backgroundColor: 'transparent',
              border: 'none', borderBottom: activeTab === 'open' ? '3px solid #0056D2' : '3px solid transparent',
              color: activeTab === 'open' ? '#0056D2' : '#999',
              fontWeight: activeTab === 'open' ? 'bold' : 'normal', fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            오픈 게시판
          </button>
          <button 
            onClick={() => setActiveTab('crew')}
            style={{
              flex: 1, padding: '12px 0', backgroundColor: 'transparent',
              border: 'none', borderBottom: activeTab === 'crew' ? '3px solid #0056D2' : '3px solid transparent',
              color: activeTab === 'crew' ? '#0056D2' : '#999',
              fontWeight: activeTab === 'crew' ? 'bold' : 'normal', fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            크루
          </button>
          <button 
            onClick={() => setActiveTab('notice')}
            style={{
              flex: 1, padding: '12px 0', backgroundColor: 'transparent',
              border: 'none', borderBottom: activeTab === 'notice' ? '3px solid #FF3B30' : '3px solid transparent',
              color: activeTab === 'notice' ? '#FF3B30' : '#999',
              fontWeight: activeTab === 'notice' ? '900' : 'bold', fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            공지사항
          </button>
          <button 
            onClick={() => setActiveTab('business')}
            style={{
              flex: 1, padding: '12px 0', backgroundColor: 'transparent',
              border: 'none', borderBottom: activeTab === 'business' ? '3px solid #0056D2' : '3px solid transparent',
              color: activeTab === 'business' ? '#0056D2' : '#999',
              fontWeight: activeTab === 'business' ? '900' : 'bold', fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            선상 배 홍보
          </button>
        </div>
      </div>

      {/* 탭 내용 렌더링 영역 */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : activeTab === 'notice' ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {noticePosts.map(notice => (
              <div key={notice.id} style={{ backgroundColor: notice.isPinned ? '#FFF1F0' : '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative', border: notice.isPinned ? '1px solid #FFCCC7' : '1px solid #E5E5EA' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                   {notice.isPinned && <div style={{ padding: '4px 8px', backgroundColor: '#FF3B30', color: '#fff', fontSize: '10px', borderRadius: '6px', fontWeight: '900' }}>중요 필독</div>}
                   <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>{notice.date}</div>
                   <div style={{ fontSize: '11px', color: '#aaa', marginLeft: 'auto' }}>조회 {notice.views}</div>
                 </div>
                 <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1c1c1e', marginBottom: '10px', wordBreak: 'keep-all' }}>{notice.title}</h3>
                 <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', paddingBottom: isAdmin ? '30px' : '0' }}>{notice.content}</p>
                 
                 {isAdmin && (
                   <button onClick={(e) => handleDeletePost(e, notice.id, 'notice')} style={{ position: 'absolute', bottom: '16px', right: '16px', border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <Trash2 size={14} /> 삭제
                   </button>
                 )}
              </div>
            ))}
          </div>
        ) : activeTab === 'open' ? (
          // [오픈 게시판 뷰]
          <div className="fade-in">
            {posts.map((post, index) => (
              <React.Fragment key={post.id}>
                <div 
                  onClick={() => navigate(`/post/${post.id}`)}
                  style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {post.author === 'sunjulab' ? (
                        <span style={{ fontSize: '10px', background: 'linear-gradient(135deg, #E60000, #990000)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>MASTER</span>
                      ) : post.author_email === 'premium_user@fishinggo.com' ? (
                        <span style={{ fontSize: '10px', background: 'linear-gradient(135deg, #FFD700, #F57F17)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>PRO</span>
                      ) : null}
                      <span style={{ fontSize: '11px', backgroundColor: 'rgba(0,86,210,0.08)', color: '#0056D2', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' }}>{post.category}</span>
                      <strong style={{ fontSize: '14px', color: '#333' }}>{post.author}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#bbb' }}>{post.time}</span>
                      {isAdmin && (
                        <button onClick={(e) => handleDeletePost(e, post.id, 'open')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF3B30' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: '8px 0 16px 0', fontSize: '15px', color: '#1c1c1e', lineHeight: '1.6', fontWeight: '400' }}>{post.content}</p>
                  {post.image && (
                    <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #f0f0f0' }}>
                      <img src={post.image} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', color: '#8e8e93', borderTop: '1px solid #f8f8f8', paddingTop: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Heart size={16} color="#FF5A5F" /> {post.likes}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><MessageSquare size={16} /> {post.comments?.length || 0}</span>
                  </div>
                </div>
                {/* [정지 방지] 4개 글당 1개 - 과도한 광고 도배 금지 */}
                {(index + 1) % 4 === 0 && <NativeAd />}
                {!canAccessPremium && (index + 1) % AD_CONFIG.FREE_USER.FEED_AD_INTERVAL === 0 && <InFeedAd />}
              </React.Fragment>
            ))}
          </div>
        ) : activeTab === 'crew' ? (
          // [프라이빗 크루 뷰]
          <div className="fade-in">
            {crews.map(crew => (
              <div key={crew.id} style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#1c1c1e' }}>{crew.name}</h3>
                  <div style={{ display: 'flex', gap: '12px', color: '#8e8e93', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> 인원 {crew.members}</span>
                    {crew.lastActive && <span style={{ color: '#bbb' }}>활동 {crew.lastActive}</span>}
                  </div>
                </div>
                {crew.isPrivate ? (
                  <button 
                    onClick={() => {
                      const pass = window.prompt(`${crew.name} 크루의 입장 코드 4자리를 입력하세요.`);
                      if (pass === crew.password) {
                        navigate(`/crew/${crew.id}/chat`);
                      } else if (pass !== null) {
                        addToast('입장 코드가 일치하지 않습니다.', 'error');
                      }
                    }} 
                    style={{ backgroundColor: '#f5f5f7', border: 'none', padding: '12px', borderRadius: '50%', color: '#0056D2', cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <Lock size={20} />
                  </button>
                ) : (
                  <button onClick={() => navigate(`/crew/${crew.id}/chat`)} style={{ backgroundColor: '#0056D2', border: 'none', padding: '8px 18px', borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,86,210,0.2)' }}>
                    입장하기
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          // [비즈니스: 선상 배 홍보 뷰]
          <div className="fade-in">
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #0A192F, #1A365D)', borderRadius: '16px', marginBottom: '20px', color: '#fff', boxShadow: '0 8px 24px rgba(10,25,47,0.2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}><Award size={100} /></div>
              <div style={{ fontSize: '15px', fontWeight: '950', color: '#FFD700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} /> 프리미엄 선상 직거래 
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '12.5px', fontWeight: '700', lineHeight: '1.4' }}>비즈니스 인증을 거친 검증된 선장님들의 공간입니다.</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>게시물 하단의 [직통 전화] 버튼을 눌러 수수료 없이 다이렉트 예약하세요!</p>
            </div>
            
            {effectiveBusinessPosts.map((post) => (
              <div 
                key={post.id} 
                className={post.isPinned ? "pulse-border" : ""}
                style={{ 
                  backgroundColor: post.isPinned ? '#FEFCF5' : '#fff', 
                  borderRadius: '20px', marginBottom: '16px', 
                  boxShadow: post.isPinned ? '0 10px 30px rgba(255,215,0,0.15)' : '0 4px 14px rgba(0,0,0,0.04)', 
                  border: post.isPinned ? '2.5px solid #FFD700' : '1.5px solid #F0F2F7', 
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {post.isPinned && (
                  <div style={{ background: 'linear-gradient(90deg, #FFD700, #FFA000)', color: '#5C3A00', padding: '6px 14px', fontSize: '11px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} fill="#5C3A00" /> VVIP 프리미엄 스폰서 (해당 지역 1위)
                  </div>
                )}
                <div style={{ padding: '16px' }} onClick={() => navigate(`/post/${post.id}`)}>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <img src={post.cover} style={{ width: '100px', height: '100px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0, border: '1px solid #eee' }} alt="배 이미지" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                       <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                         <span style={{ fontSize: '10px', background: post.isPinned ? '#E65100' : '#FF5A5F', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: '950' }}>예약 모집중</span>
                         <span style={{ fontSize: '16px', fontWeight: '950', color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.shipName}</span>
                         {isAdmin && (
                           <button onClick={(e) => handleDeletePost(e, post.id, 'business')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF3B30', marginLeft: 'auto' }}>
                             <Trash2 size={16} />
                           </button>
                         )}
                       </div>
                       <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#555', lineHeight: '1.5', fontWeight: post.isPinned?'700':'400' }}>{post.content.slice(0, 52)}...</p>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px', color: '#1565C0', fontWeight: '900' }}>
                         <span style={{ background: '#F4F6FA', padding: '5px 10px', borderRadius: '8px', color: '#333' }}>{post.target}</span>
                         <span style={{ background: '#F4F6FA', padding: '5px 10px', borderRadius: '8px', color: '#333' }}>{post.date}</span>
                         <span style={{ background: '#FFF3E0', padding: '5px 10px', borderRadius: '8px', color: '#E65100' }}>{post.price}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* 하단 강력한 CTA 영역 (예약 전환율 극대화) */}
                <div style={{ padding: '12px 16px', background: post.isPinned ? '#FFFDF4' : '#F8F9FA', borderTop: post.isPinned ? '1px solid rgba(255,215,0,0.3)' : '1px solid #F0F2F7', display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${post.phone || '010-1234-5678'}`; }}
                    style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '950', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,86,210,0.2)', transition: 'transform 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform='scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform='scale(1)'}
                  >
                    <Phone size={16} fill="#fff" /> 선장님께 즉시 전화
                  </button>
                  <button 
                    onClick={() => navigate(`/crew/msg/${post.id}`)}
                    style={{ backgroundColor: '#fff', color: '#0056D2', border: '1.5px solid #0056D2', padding: '14px 16px', borderRadius: '12px', fontWeight: '900', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <MessageSquare size={16} /> 앱 채팅
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 플로팅 글쓰기/방만들기 버튼 (FAB) */}
      {(!((activeTab === 'notice') && !isAdmin)) && (
        <button 
          onClick={handleFabClick}
          style={{
            position: 'fixed', bottom: '90px', right: '20px', backgroundColor: activeTab === 'notice' ? '#FF3B30' : '#0056D2', color: '#fff',
            border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', justifyContent: 'center', alignItems: 'center',
            boxShadow: activeTab === 'notice' ? '0 8px 16px rgba(255, 59, 48, 0.4)' : '0 8px 16px rgba(0, 86, 210, 0.4)', cursor: 'pointer', zIndex: 100, transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <PlusCircle size={32} />
        </button>
      )}
    </div>
  );
}
