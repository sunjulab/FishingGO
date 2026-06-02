// restructure-shop.mjs — 추천 상품 카테고리 탭 추가 + 상단 섹션 제거
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
let src = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// ── 1. CATEGORIES에 '⭐ 추천' 탭 맨 앞에 추가 ──────────────────────────────
src = src.replace(
  `const CATEGORIES = [\n  { name: '전체',`,
  `const CATEGORIES = [\n  { name: '⭐ 추천',       query: '',           source: 'manual'  },\n  { name: '전체',`
);

// ── 2. CAT_MANUAL_FILTER에 추가 ──────────────────────────────────────────
src = src.replace(
  `const CAT_MANUAL_FILTER = {\n  '전체':`,
  `const CAT_MANUAL_FILTER = {\n  '⭐ 추천':      null,\n  '전체':`
);

// ── 3. handleCatClick: manual source면 API 호출 스킵 ─────────────────────
src = src.replace(
  `  const handleCatClick = (cat) => {\n    setActiveCat(cat.name);\n    setSearchQuery('');    // 카테고리 클릭 시 검색어 초기화\n    setSearch('');\n    fetchProducts(cat.query, cat.source);\n  };`,
  `  const handleCatClick = (cat) => {\n    setActiveCat(cat.name);\n    setSearchQuery('');\n    setSearch('');\n    if (cat.source !== 'manual') {\n      fetchProducts(cat.query, cat.source);\n    }\n  };`
);

// ── 4. gridTitle에 추천 케이스 추가 ──────────────────────────────────────
src = src.replace(
  `  const gridTitle = searchQuery\n    ? \`🔍 "\${searchQuery}" 검색결과\`\n    : activeCat === '전체'\n    ? '전체 상품 (Coupang + AliExpress)'\n    : \`\${activeCat} 상품\`;`,
  `  const gridTitle = searchQuery\n    ? \`🔍 "\${searchQuery}" 검색결과\`\n    : activeCat === '⭐ 추천'\n    ? '⭐ 추천 낚시 상품'\n    : activeCat === '전체'\n    ? '전체 상품 (Coupang + AliExpress)'\n    : \`\${activeCat} 상품\`;`
);

// ── 5. 상단 '추천 낚시 상품' 가로 스크롤 섹션 제거 ──────────────────────
// 이 섹션은 filteredManualItems.length > 0 로 시작함
const TOP_SECTION_START = `      {/* ✅ 수동 등록 상품 — 카테고리 필터 연동 */}\n      {filteredManualItems.length > 0 && (`;
const TOP_SECTION_END   = `      )}\n\n      {/* ── AliExpress 오늘 특가 배너`;

const tsIdx = src.indexOf(TOP_SECTION_START);
const teIdx = src.indexOf(TOP_SECTION_END, tsIdx);

if (tsIdx !== -1 && teIdx !== -1) {
  src = src.slice(0, tsIdx) + `\n      {/* ── AliExpress 오늘 특가 배너` + src.slice(teIdx + TOP_SECTION_END.length);
  console.log('✅ 상단 추천 섹션 제거');
} else {
  console.log('⚠️ 상단 섹션 못찾음, tsIdx:', tsIdx, 'teIdx:', teIdx);
}

// ── 6. 전체 상품 그리드 영역: 추천 탭일 때 manualItems 그리드 표시 ────────
// 기존 그리드는 {/* 전체 상품 그리드 */} 또는 loading으로 시작
// products를 표시하는 부분 앞에 추천 탭 조건 추가

const GRID_SECTION_MARKER = `      {/* ── 전체 상품 그리드 ──`;
const gridIdx = src.indexOf(GRID_SECTION_MARKER);

if (gridIdx !== -1) {
  const MANUAL_GRID = `      {/* ── 추천 상품 탭: manualItems 그리드 ── */}
      {activeCat === '⭐ 추천' && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>⭐</span>
            <span style={{ fontSize: 'calc(14px * var(--fs, 1))', fontWeight: '900', color: '#1c1c1e' }}>추천 낚시 상품</span>
            <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#8E8E93', fontWeight: '700' }}>({manualItems.length})</span>
          </div>
          {manualItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#C7C7CC', fontSize: 'calc(13px * var(--fs, 1))', fontWeight: '700' }}>
              등록된 추천 상품이 없습니다
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {manualItems.map(item => (
                <div key={item._id} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', background: '#fff', border: '1px solid #F0F0F0' }}>
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', textDecoration: 'none' }}
                  >
                    {item.source === 'ali' ? (
                      <>
                        <img src={item.imageUrl} alt={item.productName || '상품'} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '8px 10px 10px' }}>
                          <span style={{ display: 'inline-block', background: '#FF6900', color: '#fff', fontSize: '8px', fontWeight: '900', padding: '2px 5px', borderRadius: '4px', marginBottom: '4px' }}>AliExpress</span>
                          {item.productName && (
                            <div style={{ fontSize: 'calc(11px * var(--fs, 1))', fontWeight: '700', color: '#1c1c1e', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.productName}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <iframe
                        src={item.iframeSrc}
                        width="100%"
                        height={240}
                        frameBorder={0}
                        scrolling="no"
                        referrerPolicy="unsafe-url"
                        title={\`쿠팡 상품 \${item.tag}\`}
                        style={{ display: 'block', pointerEvents: 'none' }}
                      />
                    )}
                  </a>
                  {isAdmin && (
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }}
                      style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,59,48,0.93)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                      title="삭제"
                    >
                      <X size={13} color="#fff" strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

`;

  src = src.slice(0, gridIdx) + MANUAL_GRID + src.slice(gridIdx);
  console.log('✅ 추천 탭 그리드 추가');
} else {
  console.log('⚠️ 그리드 마커 못찾음');
}

// ── 7. API 상품 그리드는 추천 탭일 때 숨김 ─────────────────────────────────
// 전체 상품 그리드 섹션을 activeCat !== '⭐ 추천' 조건으로 감싸기
// 이미 {/* ── 전체 상품 그리드 ── */}로 시작하는 섹션 찾기

const GRID_START2 = src.indexOf(GRID_SECTION_MARKER);
if (GRID_START2 !== -1) {
  // 그 줄의 시작을 찾아서 조건부로 감싸기
  // 단, 이미 추천 그리드 뒤에 있으므로 그 위치부터
  const lineEnd = src.indexOf('\n', GRID_START2);
  const beforeGrid = src.slice(0, GRID_START2);
  const afterGridStart = src.slice(GRID_START2);
  
  // 전체 상품 그리드 섹션의 끝 찾기 (마지막 큰 div 닫기)
  // 파트너스 공시 섹션 바로 전 </div> 를 찾아야 함
  src = beforeGrid + `      {activeCat !== '⭐ 추천' && (\n      <>\n` + afterGridStart;
  
  // 파트너스 공시 섹션 앞에 닫기 태그 삽입
  const PARTNER_NOTICE = `      {/* ── 파트너스 공시 ── */}`;
  const pIdx = src.lastIndexOf(PARTNER_NOTICE);
  if (pIdx !== -1) {
    src = src.slice(0, pIdx) + `      </>\n      )}\n\n` + src.slice(pIdx);
    console.log('✅ API 그리드 조건부 처리');
  }
}

writeFileSync(file, src.replace(/\n/g, '\r\n'), 'utf8');
console.log('✅ 완료. 줄수:', src.split('\n').length);
