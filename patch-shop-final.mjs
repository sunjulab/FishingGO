// Shop.jsx 최종 패치 — 인라인 등록폼 + 개별 삭제 버튼
// Fixed modal 방식 완전 제거 → 페이지 내부 inline 방식으로 전환
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
let src = readFileSync(file, 'utf8');

// ── 1. import 교체 ──────────────────────────────────────────────────
src = src.replace(
  `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X } from 'lucide-react';
import apiClient from '../api/index';`,
  `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X, Plus, Trash2 } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';`
);

// ── 2. 상수 추가 ─────────────────────────────────────────────────────
src = src.replace(
  `const COUPANG_PARTNERS_ID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';`,
  `const COUPANG_PARTNERS_ID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';
const API_BASE   = 'https://fishing-go-backend.onrender.com';
const DIRECT_KEY = 'FishingGO_Admin_Direct_2026';
const SHOP_TAGS  = ['낚시용품','루어/채비','릴/로드','라인/원줄','낚시복','가방/케이스','액세서리','기타'];`
);

// ── 3. 함수 컴포넌트 내부 상태 추가 ─────────────────────────────────
// "export default function Shop() {" 뒤에 isAdmin + 폼 상태 추가
const insertAfter = `  const [searchQuery,  setSearchQuery]  = useState(''); // ✅ 실제 검색 중인 키워드`;
const newStates = `  const [searchQuery,  setSearchQuery]  = useState(''); // ✅ 실제 검색 중인 키워드

  // ── MASTER 전용 ────────────────────────────────────────────────────
  const isAdmin = useUserStore(s =>
    s.userId === ADMIN_ID ||
    s.userEmail === ADMIN_EMAIL ||
    s.userEmail === 'sunjulab.k@gmail.com' ||
    s.userTier  === 'MASTER'
  );
  const [showRegForm, setShowRegForm] = useState(false);
  const [regSrc,  setRegSrc]  = useState('coupang');
  const [regTag,  setRegTag]  = useState('낚시용품');
  const [regShortUrl,    setRegShortUrl]    = useState('');
  const [regIframeCode,  setRegIframeCode]  = useState('');
  const [regImageUrl,    setRegImageUrl]    = useState('');
  const [regProductName, setRegProductName] = useState('');
  const [regMsg,   setRegMsg]   = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleRegSubmit = async () => {
    if (!regShortUrl.trim()) { setRegMsg('❌ 단축 URL 필수'); return; }
    setRegLoading(true); setRegMsg('⏳ 등록 중...');
    try {
      const iframeSrc = regSrc === 'coupang'
        ? (regIframeCode.match(/src=["']([^"']+)["']/i)?.[1] || '')
        : '';
      if (regSrc === 'coupang' && !iframeSrc) {
        setRegMsg('❌ iframe 코드에서 src를 찾을 수 없습니다'); setRegLoading(false); return;
      }
      const params = new URLSearchParams({
        key: DIRECT_KEY, source: regSrc,
        shortUrl: regShortUrl.trim(), iframeSrc,
        imageUrl: regImageUrl.trim(), productName: regProductName.trim(), tag: regTag,
      });
      const res  = await fetch(\`\${API_BASE}/api/shop/manual/direct?\${params}\`);
      const data = await res.json();
      if (data.ok) {
        setRegMsg('✅ 등록 완료!');
        setRegShortUrl(''); setRegIframeCode(''); setRegImageUrl(''); setRegProductName('');
        apiClient.get('/api/shop/manual').then(r => setManualItems(r.data || [])).catch(() => {});
        setTimeout(() => { setShowRegForm(false); setRegMsg(''); }, 1500);
      } else { setRegMsg(\`❌ \${data.error || '등록 실패'}\`); }
    } catch (e) { setRegMsg(\`❌ 오류: \${e.message}\`); }
    finally { setRegLoading(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(\`"\${item.tag || item.source}" 상품을 삭제할까요?\`)) return;
    try {
      const params = new URLSearchParams({ key: DIRECT_KEY, id: item._id });
      const res  = await fetch(\`\${API_BASE}/api/shop/manual/delete-direct?\${params}\`);
      const data = await res.json();
      if (data.ok) setManualItems(prev => prev.filter(i => i._id !== item._id));
      else alert(\`삭제 실패: \${data.error}\`);
    } catch (e) { alert(\`오류: \${e.message}\`); }
  };`;

src = src.replace(insertAfter, newStates);

// ── 4. 추천 낚시 상품 섹션 헤더에 + 버튼 추가 + 인라인 폼 삽입 ────
// 기존: filteredManualItems.length > 0 && (...) 블록 전체 교체
const OLD_MANUAL_SECTION = `      {/* ✅ 수동 등록 상품 — 카테고리 필터 연동 */}
      {filteredManualItems.length > 0 && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>🛒</span>
            <span style={{ fontSize: \`calc(13px * var(--fs, 1))\`, fontWeight: '900', color: '#1c1c1e' }}>추천 낚시 상품</span>
            {activeCat !== '전체' && (
              <span style={{ fontSize: \`calc(10px * var(--fs, 1))\`, color: '#8E8E93', fontWeight: '700', marginLeft: '4px' }}>· {activeCat}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {filteredManualItems.map(item => (
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
            ))}
          </div>
          {/* 면책 문구 */}
          {filteredManualItems.some(i => !i.source || i.source === 'coupang') && (
            <div style={{ fontSize: \`calc(9px * var(--fs, 1))\`, color: '#C7C7CC', fontWeight: '700', marginTop: '4px', paddingLeft: '2px' }}>
              이 상품은 쿠팡 파트너스를 통해 제공되며 구매 시 일정액의 수수료를 받을 수 있습니다.
            </div>
          )}
          {filteredManualItems.some(i => i.source === 'ali') && (
            <div style={{ fontSize: \`calc(9px * var(--fs, 1))\`, color: '#C7C7CC', fontWeight: '700', marginTop: '2px', paddingLeft: '2px' }}>
              AliExpress 제휴 링크를 포함하며 구매 시 수수료를 받을 수 있습니다.
            </div>
          )}
        </div>
      )}`;

const NEW_MANUAL_SECTION = `      {/* ✅ 추천 낚시 상품 섹션 (MASTER: 등록/삭제 기능 포함) */}
      <div style={{ padding: '12px 12px 0' }}>
        {/* 섹션 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '16px' }}>🛒</span>
          <span style={{ fontSize: \`calc(13px * var(--fs, 1))\`, fontWeight: '900', color: '#1c1c1e' }}>추천 낚시 상품</span>
          {activeCat !== '전체' && (
            <span style={{ fontSize: \`calc(10px * var(--fs, 1))\`, color: '#8E8E93', fontWeight: '700', marginLeft: '4px' }}>· {activeCat}</span>
          )}
          {/* MASTER 전용 등록 버튼 */}
          {isAdmin && (
            <button
              onClick={() => { setShowRegForm(f => !f); setRegMsg(''); }}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', background: showRegForm ? '#1c1c1e' : 'linear-gradient(135deg,#FF9B26,#FF6B00)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: \`calc(11px * var(--fs, 1))\`, fontWeight: '900' }}
            >
              {showRegForm ? <X size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
              {showRegForm ? '닫기' : '상품 등록'}
            </button>
          )}
        </div>

        {/* MASTER 전용 인라인 등록 폼 */}
        {isAdmin && showRegForm && (
          <div style={{ background: '#F8F9FA', borderRadius: '14px', padding: '14px', marginBottom: '12px', border: '1.5px solid #E5E5EA' }}>
            {/* 플랫폼 */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {['coupang', 'ali'].map(s => (
                <button key={s} onClick={() => setRegSrc(s)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: \`2px solid \${regSrc === s ? (s==='coupang'?'#0056D2':'#FF6900') : '#E5E5EA'}\`, background: regSrc === s ? (s==='coupang'?'#EFF5FF':'#FFF3EC') : '#fff', fontWeight: '900', fontSize: '12px', cursor: 'pointer', color: regSrc === s ? (s==='coupang'?'#0056D2':'#FF6900') : '#8E8E93' }}
                >{s === 'coupang' ? '🛒 쿠팡' : '💰 알리'}</button>
              ))}
            </div>
            {/* 단축 URL */}
            <input value={regShortUrl} onChange={e => setRegShortUrl(e.target.value)}
              placeholder="단축 URL *  https://link.coupang.com/a/xxxx"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #E5E5EA', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
            />
            {/* 쿠팡: iframe */}
            {regSrc === 'coupang' && (
              <textarea value={regIframeCode} onChange={e => setRegIframeCode(e.target.value)}
                placeholder={'iframe 코드 *  <iframe src="https://coupa.ng/xxxx" ...></iframe>'}
                rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #E5E5EA', fontSize: '11px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'monospace', marginBottom: '6px' }}
              />
            )}
            {/* 알리: 이미지 + 상품명 */}
            {regSrc === 'ali' && (
              <>
                <input value={regImageUrl} onChange={e => setRegImageUrl(e.target.value)}
                  placeholder="이미지 URL  https://ae01.alicdn.com/..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #E5E5EA', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                <input value={regProductName} onChange={e => setRegProductName(e.target.value)}
                  placeholder="상품명  낚시 루어 세트 10개입"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #E5E5EA', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
                />
              </>
            )}
            {/* 카테고리 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {SHOP_TAGS.map(t => (
                <button key={t} onClick={() => setRegTag(t)}
                  style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: regTag === t ? '#1c1c1e' : '#E5E5EA', color: regTag === t ? '#fff' : '#8E8E93', fontSize: '11px', fontWeight: '850', cursor: 'pointer' }}
                >{t}</button>
              ))}
            </div>
            {/* 메시지 */}
            {regMsg && (
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '800', color: regMsg.startsWith('✅') ? '#00C48C' : regMsg.startsWith('⏳') ? '#FF9B26' : '#FF3B30', marginBottom: '8px' }}>
                {regMsg}
              </div>
            )}
            {/* 등록 버튼 */}
            <button onClick={handleRegSubmit} disabled={regLoading}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: regLoading ? '#C7C7CC' : 'linear-gradient(135deg,#0056D2,#003899)', color: '#fff', fontSize: '13px', fontWeight: '900', cursor: regLoading ? 'not-allowed' : 'pointer' }}
            >{regLoading ? '⏳ 등록 중...' : '+ 쇼핑탭에 등록'}</button>
          </div>
        )}

        {/* 상품 카드 목록 */}
        {filteredManualItems.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {filteredManualItems.map(item => (
              <div key={item._id} style={{ flexShrink: 0, position: 'relative' }}>
                {item.source === 'ali' ? (
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer sponsored"
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
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}
                  >
                    <iframe src={item.iframeSrc} width={120} height={240} frameBorder={0} scrolling="no"
                      referrerPolicy="unsafe-url" title={\`쿠팡 \${item.tag}\`}
                      style={{ display: 'block', pointerEvents: 'none' }}
                    />
                  </a>
                )}
                {/* MASTER 삭제 버튼 */}
                {isAdmin && (
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }}
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,59,48,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
                  >
                    <Trash2 size={11} color="#fff" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {filteredManualItems.length === 0 && !showRegForm && isAdmin && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#C7C7CC', fontSize: '12px', fontWeight: '700' }}>
            등록된 상품이 없습니다. 위 버튼으로 추가하세요 🎣
          </div>
        )}
        {/* 면책 문구 */}
        {filteredManualItems.some(i => !i.source || i.source === 'coupang') && (
          <div style={{ fontSize: \`calc(9px * var(--fs, 1))\`, color: '#C7C7CC', fontWeight: '700', marginTop: '4px' }}>
            이 상품은 쿠팡 파트너스를 통해 제공되며 구매 시 일정액의 수수료를 받을 수 있습니다.
          </div>
        )}
      </div>`;

src = src.replace(OLD_MANUAL_SECTION, NEW_MANUAL_SECTION);

writeFileSync(file, src, 'utf8');
const lineCount = src.split('\n').length;
console.log('✅ 완료. 줄수:', lineCount);

// 교체 확인
const hasFixed   = src.includes("position: 'fixed'");
const hasInline  = src.includes('showRegForm');
const hasFAB     = src.includes('52px.*52px');
const hasDelete  = src.includes('handleDelete');
const hasHeader  = src.includes('상품 등록');
console.log('fixed 포지션:', hasFixed, '(false여야 정상)');
console.log('인라인 폼:',    hasInline);
console.log('handleDelete:', hasDelete);
console.log('상품 등록 버튼:', hasHeader);
