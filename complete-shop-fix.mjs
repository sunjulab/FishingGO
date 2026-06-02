// complete-shop-fix.mjs — CRLF 완벽 처리, Shop.jsx 누락 UI 전부 추가
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
// CRLF 그대로 읽기
let src = readFileSync(file, 'utf8');

// 비교용 LF 버전
const norm = src.replace(/\r\n/g, '\n');

// ── 1. 헤더 span → MASTER 버튼 ──────────────────────────────────────
const OLD_SPAN =
`          <span style={{ fontSize: \`calc(10px * var(--fs, 1))\`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
            Coupang + AliExpress 🎣
          </span>
        </div>`;

const NEW_SPAN =
`          {isAdmin ? (
            <button
              onClick={() => setShowRegForm(true)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '10px', background: 'linear-gradient(135deg,#FF9B26,#FF6B00)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: \`calc(11px * var(--fs, 1))\`, fontWeight: '900', flexShrink: 0 }}
            >
              <Plus size={13} strokeWidth={3} />
              상품 등록
            </button>
          ) : (
            <span style={{ fontSize: \`calc(10px * var(--fs, 1))\`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
              Coupang + AliExpress 🎣
            </span>
          )}
        </div>`;

if (!norm.includes(OLD_SPAN)) {
  console.error('❌ 헤더 span 못 찾음');
} else {
  src = src.replace(/\r\n/g, '\n').replace(OLD_SPAN, NEW_SPAN).replace(/\n/g, '\r\n');
  console.log('✅ 헤더 버튼 추가');
}

// 다시 norm 갱신
const norm2 = src.replace(/\r\n/g, '\n');

// ── 2. 카드 래퍼 + 삭제 버튼 ────────────────────────────────────────
const OLD_MAP =
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
            )}`;

const NEW_MAP =
`            {filteredManualItems.map(item => (
              <div key={item._id} style={{ flexShrink: 0, position: 'relative' }}>
                {item.source === 'ali' ? (
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
                {isAdmin && (
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }}
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,59,48,0.93)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                    title="삭제"
                  >
                    <X size={12} color="#fff" strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}`;

if (!norm2.includes(OLD_MAP)) {
  console.error('❌ 카드 맵 못 찾음');
} else {
  src = src.replace(/\r\n/g, '\n').replace(OLD_MAP, NEW_MAP).replace(/\n/g, '\r\n');
  console.log('✅ 삭제 버튼 추가');
}

// ── 3. 모달 UI — 파일 끝 </div>\n  );\n} 앞에 삽입 ─────────────────
const MODAL = `
      {/* ── MASTER 상품 등록 모달 ── */}
      {isAdmin && showRegForm && (
        <div
          onClick={() => setShowRegForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🛒</span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#1c1c1e' }}>상품 등록</span>
                <span style={{ fontSize: '10px', background: 'linear-gradient(135deg,#FF9B26,#FF6B00)', color: '#fff', padding: '2px 7px', borderRadius: '6px', fontWeight: '900' }}>MASTER</span>
              </div>
              <button onClick={() => setShowRegForm(false)} style={{ background: '#F2F2F7', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#1c1c1e" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {['coupang','ali'].map(s => (
                <button key={s} onClick={() => setRegSrc(s)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: \`2px solid \${regSrc===s?(s==='coupang'?'#0056D2':'#FF6900'):'#F2F2F7'}\`, background: regSrc===s?(s==='coupang'?'#EFF5FF':'#FFF3EC'):'#F2F2F7', fontWeight: '900', fontSize: '13px', cursor: 'pointer', color: regSrc===s?(s==='coupang'?'#0056D2':'#FF6900'):'#8E8E93' }}
                >{s==='coupang'?'🛒 쿠팡':'💰 알리'}</button>
              ))}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>단축 URL *</div>
              <input value={regShortUrl} onChange={e=>setRegShortUrl(e.target.value)} placeholder="https://link.coupang.com/a/xxxx"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {regSrc==='coupang' && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>iframe 코드 *</div>
                <textarea value={regIframeCode} onChange={e=>setRegIframeCode(e.target.value)}
                  placeholder='<iframe src="https://coupa.ng/xxxx" ...></iframe>' rows={3}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
              </div>
            )}
            {regSrc==='ali' && (<>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>상품 이미지 URL *</div>
                <input value={regImageUrl} onChange={e=>setRegImageUrl(e.target.value)} placeholder="https://ae01.alicdn.com/..."
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>상품명</div>
                <input value={regProductName} onChange={e=>setRegProductName(e.target.value)} placeholder="낚시 루어 세트 10개입"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </>)}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '8px' }}>카테고리</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SHOP_TAGS.map(t => (
                  <button key={t} onClick={() => setRegTag(t)}
                    style={{ padding: '7px 12px', borderRadius: '10px', border: 'none', background: regTag===t?'#1c1c1e':'#F2F2F7', color: regTag===t?'#fff':'#8E8E93', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                  >{t}</button>
                ))}
              </div>
            </div>
            {regMsg && (
              <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '800', color: regMsg.startsWith('✅')?'#00C48C':regMsg.startsWith('⏳')?'#FF9B26':'#FF3B30', marginBottom: '12px' }}>
                {regMsg}
              </div>
            )}
            <button onClick={handleRegSubmit} disabled={regLoading}
              style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: regLoading?'#C7C7CC':'linear-gradient(135deg,#0056D2,#003899)', color: '#fff', fontSize: '15px', fontWeight: '900', cursor: regLoading?'not-allowed':'pointer' }}
            >{regLoading?'⏳ 등록 중...':'+ 쇼핑탭에 등록'}</button>
          </div>
        </div>
      )}
`;

const END_MARKER = `    </div>\n  );\n}`;
const src_lf = src.replace(/\r\n/g, '\n');

if (!src_lf.endsWith(END_MARKER + '\n') && !src_lf.endsWith(END_MARKER)) {
  console.error('❌ 파일 끝 마커 못 찾음');
  console.log('파일 마지막 50자:', JSON.stringify(src_lf.slice(-100)));
} else {
  const newEnd = `    </div>\n${MODAL}\n  );\n}`;
  src = src_lf.replace(END_MARKER, newEnd).replace(/\n/g, '\r\n');
  console.log('✅ 모달 추가');
}

// SHOP_TAGS 없으면 추가
if (!src.includes('SHOP_TAGS')) {
  src = src.replace(
    "const DIRECT_KEY = 'FishingGO_Admin_Direct_2026';",
    "const DIRECT_KEY = 'FishingGO_Admin_Direct_2026';\r\nconst SHOP_TAGS  = ['낚시용품','루어/채비','릴/로드','라인/원줄','낚시복','가방/케이스','액세서리','기타'];"
  );
  console.log('✅ SHOP_TAGS 추가');
}

writeFileSync(file, src, 'utf8');
console.log('✅ 완료. 줄수:', src.split('\n').length);
