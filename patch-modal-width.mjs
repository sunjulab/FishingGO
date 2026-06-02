// Shop.jsx 모달 너비 수정 + 전체 기능 완성 패치
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
let c = readFileSync(file, 'utf8');

// 1. import 수정 - Plus 추가, useUserStore import 추가
c = c.replace(
  `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X } from 'lucide-react';
import apiClient from '../api/index';`,
  `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X, Plus } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';`
);

// 2. 헤더 span → MASTER 등록 버튼으로 교체
c = c.replace(
  `          <span style={{ fontSize: \`calc(10px * var(--fs, 1))\`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
            Coupang + AliExpress 🎣
          </span>
        </div>`,
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
        </div>`
);

// 3. 알리 카드에 삭제 버튼 추가 (카드를 div로 감싸기)
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
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,59,48,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                    title="삭제"
                  >
                    <X size={12} color="#fff" strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}`
);

// 4. 파일 끝 </div>\n  );\n}\n 바로 앞에 모달 추가
// ── 핵심: maxWidth: '480px', margin: '0 auto' 로 너비 제한
const modal = `
      {/* ── MASTER 상품 등록 모달 (너비 제한) ── */}
      {isAdmin && showRegForm && (
        <div
          onClick={() => setShowRegForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', maxHeight: '85vh', overflowY: 'auto' }}
          >
            {/* 헤더 */}
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

            {/* 플랫폼 선택 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {['coupang','ali'].map(src => (
                <button key={src} onClick={() => setRegSrc(src)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: \`2px solid \${regSrc === src ? (src==='coupang'?'#0056D2':'#FF6900') : '#F2F2F7'}\`, background: regSrc === src ? (src==='coupang'?'#EFF5FF':'#FFF3EC') : '#F2F2F7', fontWeight: '900', fontSize: '13px', cursor: 'pointer', color: regSrc === src ? (src==='coupang'?'#0056D2':'#FF6900') : '#8E8E93' }}
                >
                  {src === 'coupang' ? '🛒 쿠팡' : '💰 알리'}
                </button>
              ))}
            </div>

            {/* 단축 URL */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>단축 URL *</div>
              <input value={regShortUrl} onChange={e => setRegShortUrl(e.target.value)}
                placeholder="https://link.coupang.com/a/xxxx"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* 쿠팡: iframe 코드 */}
            {regSrc === 'coupang' && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>iframe 코드 *</div>
                <textarea value={regIframeCode} onChange={e => setRegIframeCode(e.target.value)}
                  placeholder='<iframe src="https://coupa.ng/xxxx" ...></iframe>'
                  rows={3}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }}
                />
              </div>
            )}

            {/* 알리: 이미지 URL + 상품명 */}
            {regSrc === 'ali' && (<>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>상품 이미지 URL *</div>
                <input value={regImageUrl} onChange={e => setRegImageUrl(e.target.value)}
                  placeholder="https://ae01.alicdn.com/..."
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>상품명</div>
                <input value={regProductName} onChange={e => setRegProductName(e.target.value)}
                  placeholder="낚시 루어 세트 10개입"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </>)}

            {/* 카테고리 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '8px' }}>카테고리</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SHOP_TAGS.map(t => (
                  <button key={t} onClick={() => setRegTag(t)}
                    style={{ padding: '7px 12px', borderRadius: '10px', border: 'none', background: regTag === t ? '#1c1c1e' : '#F2F2F7', color: regTag === t ? '#fff' : '#8E8E93', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* 상태 메시지 */}
            {regMsg && (
              <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '800', color: regMsg.startsWith('✅') ? '#00C48C' : regMsg.startsWith('⏳') ? '#FF9B26' : '#FF3B30', marginBottom: '12px' }}>
                {regMsg}
              </div>
            )}

            {/* 등록 버튼 */}
            <button
              onClick={handleRegSubmit}
              disabled={regLoading}
              style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: regLoading ? '#C7C7CC' : 'linear-gradient(135deg,#0056D2,#003899)', color: '#fff', fontSize: '15px', fontWeight: '900', cursor: regLoading ? 'not-allowed' : 'pointer' }}
            >
              {regLoading ? '⏳ 등록 중...' : '+ 쇼핑탭에 등록'}
            </button>
          </div>
        </div>
      )}
`;

// 파일 끝의 </div>\n  );\n} 바로 앞에 모달 삽입
c = c.replace(
  `    </div>
  );
}
`,
  `    </div>
${modal}
  );
}
`
);

writeFileSync(file, c, 'utf8');
console.log('✅ 패치 완료. 줄수:', c.split('\n').length);
