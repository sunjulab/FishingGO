// Shop.jsx 고도화 v2 — 라인 번호 기반 정밀 패치
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
let lines = readFileSync(file, 'utf8').split('\n');

// ── 1. handleDelete 삽입 위치 찾기 ──────────────────────────────────
const useEffectIdx = lines.findIndex(l => l.includes('useEffect(() => {'));
const deleteLines = [
  '',
  '  const handleDelete = async (item) => {',
  '    if (!window.confirm(`"${item.tag}" 상품을 삭제하시겠습니까?\\n${item.shortUrl}`)) return;',
  '    try {',
  '      const params = new URLSearchParams({ key: DIRECT_KEY, id: item._id });',
  '      const res = await fetch(`${API_BASE}/api/shop/manual/delete-direct?${params}`);',
  '      const data = await res.json();',
  '      if (data.ok) {',
  '        setManualItems(prev => prev.filter(i => i._id !== item._id));',
  '      } else {',
  '        alert(`삭제 실패: ${data.error}`);',
  '      }',
  '    } catch (e) {',
  '      alert(`오류: ${e.message}`);',
  '    }',
  '  };',
  '',
];
if (lines[useEffectIdx - 1]?.includes('handleDelete')) {
  console.log('handleDelete 이미 존재, 스킵');
} else {
  lines.splice(useEffectIdx, 0, ...deleteLines);
  console.log('handleDelete 삽입 완료 (줄', useEffectIdx, ')');
}

// 줄 번호가 변경됐으므로 다시 찾아야 함
// ── 2. 헤더 span → MASTER 버튼 교체 ────────────────────────────────
const spanIdx = lines.findIndex(l =>
  l.includes("Coupang + AliExpress") && l.includes('🎣')
);
if (spanIdx !== -1) {
  // span 태그 전체(3줄) 찾기: spanIdx-1 = span 시작, spanIdx = 내용, spanIdx+1 = </span>
  const spanStart = spanIdx - 1;
  const spanEnd = spanIdx + 1;
  const newBtn = [
    '          {isAdmin ? (',
    '            <button',
    '              onClick={() => { setShowRegModal(true); setRegMsg(\'\'); }}',
    '              style={{ marginLeft: \'auto\', display: \'flex\', alignItems: \'center\', gap: \'5px\', padding: \'6px 12px\', borderRadius: \'10px\', background: \'linear-gradient(135deg,#FF9B26,#FF6B00)\', border: \'none\', cursor: \'pointer\', color: \'#fff\', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: \'900\', flexShrink: 0 }}',
    '            >',
    '              <Plus size={13} strokeWidth={3} />',
    '              상품 등록',
    '            </button>',
    '          ) : (',
    '            <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: \'700\', color: \'#8E8E93\', marginLeft: \'auto\' }}>',
    '              Coupang + AliExpress 🎣',
    '            </span>',
    '          )}',
  ];
  lines.splice(spanStart, 3, ...newBtn);
  console.log('헤더 버튼 교체 완료 (줄', spanStart, ')');
} else {
  console.log('⚠️ span 못 찾음');
}

// ── 3. FAB 제거 ──────────────────────────────────────────────────────
const fabIdx = lines.findIndex(l => l.includes('MASTER 전용 상품 등록 FAB'));
if (fabIdx !== -1) {
  // FAB 블록 끝 찾기 (빈 줄까지)
  let end = fabIdx;
  while (end < lines.length && !lines[end].includes('MASTER 상품 등록 모달')) end++;
  lines.splice(fabIdx, end - fabIdx);
  console.log('FAB 제거 완료 (줄', fabIdx, '~', end - 1, ')');
} else {
  console.log('FAB 없음 (이미 제거됨)');
}

// ── 4. 각 카드에 삭제 버튼 삽입 ──────────────────────────────────────
// 알리 카드 </a> 뒤, 쿠팡 카드 </a> 뒤에 삭제 버튼 추가
// 방법: filteredManualItems.map 블록에서 key={item._id}를 가진 <a>들을 div 래퍼로 감싸기
// 이미 패치됐는지 확인
const hasWrapper = lines.some(l => l.includes('position: \'relative\'') && l.includes('item._id'));
if (hasWrapper) {
  console.log('카드 래퍼 이미 존재');
} else {
  // item.source === 'ali'로 시작하는 블록 찾기
  const mapIdx = lines.findIndex(l => l.includes('filteredManualItems.map(item =>'));
  if (mapIdx !== -1) {
    // map 다음 줄에 item.source === 'ali' 체크가 있는지 확인
    const aliCardIdx = lines.findIndex((l, i) => i > mapIdx && l.includes("item.source === 'ali'"));
    if (aliCardIdx !== -1) {
      // 앞의 ( 행 찾기
      const wrapperBefore = `              <div key={item._id} style={{ flexShrink: 0, position: 'relative' }}>`;
      // map 바로 다음 줄 삽입
      lines.splice(mapIdx + 1, 0, wrapperBefore);

      // 쿠팡 </a> 뒤의 닫는 부분 찾기
      // 닫는 패턴: "              )\n            ))}" 
      const closeIdx = lines.findIndex((l, i) => i > mapIdx + 1 && l.trimEnd() === '            ))}');
      if (closeIdx !== -1) {
        const deleteBtn = [
          '                {/* MASTER 전용 삭제 버튼 */}',
          '                {isAdmin && (',
          '                  <button',
          '                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }}',
          '                    style={{ position: \'absolute\', top: \'4px\', right: \'4px\', width: \'22px\', height: \'22px\', borderRadius: \'50%\', background: \'rgba(255,59,48,0.92)\', border: \'none\', cursor: \'pointer\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', zIndex: 10, boxShadow: \'0 1px 4px rgba(0,0,0,0.3)\' }}',
          '                    title="삭제"',
          '                  >',
          '                    <X size={12} color="#fff" strokeWidth={3} />',
          '                  </button>',
          '                )}',
          '              </div>',
        ];
        lines.splice(closeIdx, 0, ...deleteBtn);
        console.log('삭제 버튼 추가 완료');
      }
    }
  }
}

writeFileSync(file, lines.join('\n'), 'utf8');
console.log('✅ 완료. 줄수:', lines.length);
