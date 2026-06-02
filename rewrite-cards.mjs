// rewrite-cards.mjs — 카드 맵 전체를 완전히 새로 작성
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
const raw = readFileSync(file, 'utf8');
// LF로 정규화
const src = raw.replace(/\r\n/g, '\n');

// 교체할 범위 찾기: filteredManualItems.map ... ))
const START_MARKER = '            {filteredManualItems.map(item =>';
const END_MARKER   = '            ))}';

const startIdx = src.indexOf(START_MARKER);
const endIdx   = src.indexOf(END_MARKER, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('❌ 범위 못찾음');
  console.log('START:', startIdx, 'END:', endIdx);
  process.exit(1);
}

console.log(`✅ 범위: ${startIdx}~${endIdx}`);

// 새 카드 맵 코드 (깨끗하게 작성)
const NEW_CARD_MAP = `            {filteredManualItems.map(item => (
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
                      <div style={{ padding: '6px 7px', fontSize: 'calc(10px * var(--fs, 1))', fontWeight: '700', color: '#1c1c1e', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                      width={120}
                      height={240}
                      frameBorder={0}
                      scrolling="no"
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

const before = src.slice(0, startIdx);
const after  = src.slice(endIdx + END_MARKER.length);
const result = (before + NEW_CARD_MAP + after).replace(/\n/g, '\r\n');

writeFileSync(file, result, 'utf8');
console.log('✅ 카드 맵 새로 작성 완료. 총 줄수:', result.split('\n').length);
