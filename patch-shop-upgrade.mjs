import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
let c = readFileSync(file, 'utf8');

// ── 1. import에 ChevronDown 제거, Plus 유지 확인 ──────────────────
// Already has Plus from previous commit

// ── 2. handleDelete 함수 추가 (useEffect 바로 앞에) ──────────────
const deleteFunc = `
  const handleDelete = async (item) => {
    if (!window.confirm(\`"\${item.tag}" 상품을 삭제하시겠습니까?\\n\${item.shortUrl}\`)) return;
    try {
      const params = new URLSearchParams({ key: DIRECT_KEY, id: item._id });
      const res = await fetch(\`\${API_BASE}/api/shop/manual/delete-direct?\${params}\`);
      const data = await res.json();
      if (data.ok) {
        setManualItems(prev => prev.filter(i => i._id !== item._id));
      } else {
        alert(\`삭제 실패: \${data.error}\`);
      }
    } catch (e) {
      alert(\`오류: \${e.message}\`);
    }
  };

`;

c = c.replace(
  `  useEffect(() => {`,
  deleteFunc + `  useEffect(() => {`
);

// ── 3. 헤더: span 뒤에 MASTER 등록 버튼 추가 ────────────────────
c = c.replace(
  `          <span style={{ fontSize: \`calc(10px * var(--fs, 1))\`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
            Coupang + AliExpress 🎣
          </span>
        </div>`,
  `          {isAdmin ? (
            <button
              onClick={() => { setShowRegModal(true); setRegMsg(''); }}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '10px', background: 'linear-gradient(135deg,#FF9B26,#FF6B00)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: \`calc(11px * var(--fs, 1))\`, fontWeight: '900', flexShrink: 0 }}
            >
              <Plus size={13} strokeWidth={3} />
              상품 등록
            </button>
          ) : (
            <span style={{ fontSize: \`calc(10px * var(--fs, 1))\`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
              Coupang + AliExpress 🎣
            </span>
          )}
        </div>`
);

// ── 4. 각 수동 상품 카드에 삭제 버튼 추가 ─────────────────────────
// 알리 카드: </a> → wrapper div + delete btn
c = c.replace(
  `            {filteredManualItems.map(item =>
              item.source === 'ali' ? (
                /* 알리익스프레스 카드 */
                <a
                  key={item._id}
                  href={item.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', width: '120px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={item.imageUrl} alt={item.productName || '알리 상품'} width={120} height={120} style={{ display: 'block', objectFit: 'cover', width: '100%', height: '120px' }} />
                    <span style={{ position: 'absolute', top: '4px', left: '4px', background: '#FF6900', color: '#fff', fontSize: '8px', fontWeight: '900', padding: '2px 5px', borderRadius: '4px' }}>AliExpress</span>
                  </div>
                  {item.productName && (
                    <div style={{ padding: '6px 7px', fontSize: \`calc(10px * var(--fs, 1))\`, fontWeight: '700', color: '#1c1c1e', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.productName}
                    </div>
                  )}
                </a>
              ) : (
                /* 쿠팡 파트너스 iframe 카드 */
                <a
                  key={item._id}
                  href={item.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flexShrink: 0, display: 'block', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}
                >
                  <iframe
                    src={item.iframeSrc}
                    width={120} height={240}
                    frameBorder={0} scrolling="no"
                    referrerPolicy="unsafe-url"
                    title={\`쿠팡 상품 \${item.tag}\`}
                    style={{ display: 'block', pointerEvents: 'none' }}
                  />
                </a>
              )
            )}`,
  `            {filteredManualItems.map(item => (
              <div key={item._id} style={{ flexShrink: 0, position: 'relative' }}>
                {item.source === 'ali' ? (
                  /* 알리익스프레스 카드 */
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    style={{ display: 'flex', flexDirection: 'column', width: '120px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img src={item.imageUrl} alt={item.productName || '알리 상품'} width={120} height={120} style={{ display: 'block', objectFit: 'cover', width: '100%', height: '120px' }} />
                      <span style={{ position: 'absolute', top: '4px', left: '4px', background: '#FF6900', color: '#fff', fontSize: '8px', fontWeight: '900', padding: '2px 5px', borderRadius: '4px' }}>AliExpress</span>
                    </div>
                    {item.productName && (
                      <div style={{ padding: '6px 7px', fontSize: \`calc(10px * var(--fs, 1))\`, fontWeight: '700', color: '#1c1c1e', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.productName}
                      </div>
                    )}
                  </a>
                ) : (
                  /* 쿠팡 파트너스 iframe 카드 */
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}
                  >
                    <iframe
                      src={item.iframeSrc}
                      width={120} height={240}
                      frameBorder={0} scrolling="no"
                      referrerPolicy="unsafe-url"
                      title={\`쿠팡 상품 \${item.tag}\`}
                      style={{ display: 'block', pointerEvents: 'none' }}
                    />
                  </a>
                )}
                {/* MASTER 전용 삭제 버튼 */}
                {isAdmin && (
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }}
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,59,48,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                    title="삭제"
                  >
                    <X size={12} color="#fff" strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}`
);

// ── 5. FAB 버튼 제거 ──────────────────────────────────────────────
c = c.replace(
  `      {/* ── MASTER 전용 상품 등록 FAB ── */}
      {isAdmin && (
        <button
          onClick={() => { setShowRegModal(true); setRegMsg(''); }}
          style={{
            position: 'fixed', bottom: '90px', right: '16px', zIndex: 200,
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#FF9B26,#FF6B00)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(255,107,0,0.45)',
          }}
          title="상품 등록 (MASTER)"
        >
          <Plus size={24} color="#fff" strokeWidth={3} />
        </button>
      )}

      {/* ── MASTER 상품 등록 모달 ── */}`,
  `      {/* ── MASTER 상품 등록 모달 ── */}`
);

writeFileSync(file, c, 'utf8');
console.log('✅ 패치 완료');
console.log('줄수:', c.split('\n').length);
