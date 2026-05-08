/**
 * MyPage.jsx 크루 탭 패치 스크립트
 * 실행: node patch-mypage-crew.js
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'MyPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 탐색 패턴: records 탭 끝 -> posts 탭 시작 부분
// 다양한 줄바꿈 패턴 지원
const patterns = [
  "          ) : (\r\n            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>",
  "          ) : (\n            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>",
];

const crewsTab = `          ) : activeTab === 'crews' ? (
           <div>
             {myCrews.length === 0 ? (
               <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                 <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚓</div>
                 <p style={{ fontSize: '15px', fontWeight: '800', color: '#555', marginBottom: '6px' }}>아직 가입한 크루가 없습니다</p>
                 <p style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '20px' }}>커뮤니티에서 크루에 참여해보세요!</p>
                 <button onClick={() => navigate('/community?tab=crew')} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#0056D2,#0096FF)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>크루 찾아보기 🎣</button>
               </div>
             ) : myCrews.map(crew => {
               const crewId = String(crew._id || crew.id);
               const isOwner = crew.owner === user?.email;
               return (
                 <div key={crewId} style={{ background: '#fff', borderRadius: '20px', padding: '18px 20px', border: '1.5px solid #F2F2F7', marginBottom: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOwner ? 0 : '10px' }}>
                     <div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                         {isOwner && <span style={{ fontSize: '9px', background: '#FFD700', color: '#1c1c1e', padding: '2px 6px', borderRadius: '6px', fontWeight: '900' }}>크루장</span>}
                         <span style={{ fontSize: '16px', fontWeight: '900', color: '#1c1c1e' }}>{crew.name}</span>
                       </div>
                       <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#8e8e93' }}>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Users size={12} /> {crew.members}/{crew.limit || 20}명</span>
                         {crew.region && crew.region !== '전국' && <span>📍 {crew.region}</span>}
                       </div>
                     </div>
                     <button onClick={() => navigate(\`/crew/\${crewId}/chat\`)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#0056D2,#0096FF)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}>채팅 입장</button>
                   </div>
                   {!isOwner && (
                     <button disabled={leavingCrewId === crewId} onClick={async () => {
                       setLeavingCrewId(crewId);
                       try {
                         await apiClient.post(\`/api/community/crews/\${crewId}/leave\`, { email: user.email });
                         setMyCrews(prev => prev.filter(c => String(c._id || c.id) !== crewId));
                         addToast('크루에서 탈퇴했습니다.', 'success');
                       } catch (err) { addToast(err.response?.data?.error || '탈퇴 실패', 'error'); }
                       finally { setLeavingCrewId(null); }
                     }} style={{ width: '100%', padding: '8px', border: '1.5px solid #FFE5E5', borderRadius: '10px', background: '#FFF0F0', color: '#FF3B30', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                       {leavingCrewId === crewId ? '탈퇴 중...' : '크루 나가기'}
                     </button>
                   )}
                 </div>
               );
             })}
           </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>`;

let patched = false;
for (const pattern of patterns) {
  if (content.includes(pattern)) {
    content = content.replace(pattern, crewsTab);
    patched = true;
    console.log('✅ 크루 탭 삽입 성공! (패턴: ' + (patterns.indexOf(pattern) === 0 ? 'CRLF' : 'LF') + ')');
    break;
  }
}

if (!patched) {
  console.log('❌ 패턴을 찾지 못했습니다. 수동으로 삽입이 필요합니다.');
  console.log('   MyPage.jsx 약 651번째 줄에서 다음을 찾아 수정하세요:');
  console.log('   ) : (');
  console.log('     <div style={{ display: flex, flexDirection: column, gap: 12px }}>');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ MyPage.jsx 저장 완료!');
console.log('✅ 이제 브라우저에서 마이페이지 > 내 크루 탭을 확인하세요.');
