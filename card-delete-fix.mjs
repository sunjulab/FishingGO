// card-delete-fix.mjs - 라인 번호 기반 카드 삭제 버튼 추가
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
const raw = readFileSync(file, 'utf8');
const lines = raw.split('\n');

console.log('총 줄수:', lines.length);

// 현재 카드 맵 구조 찾기
const mapStart = lines.findIndex(l => l.includes('filteredManualItems.map(item =>'));
const mapEnd   = lines.findIndex((l, i) => i > mapStart && l.trimEnd() === '            ))}');

console.log(`카드 맵: ${mapStart+1}~${mapEnd+1}줄`);

if (mapStart === -1 || mapEnd === -1) {
  console.error('카드 맵 범위 못 찾음');
  process.exit(1);
}

// 이미 div 래퍼가 있는지 확인
if (lines[mapStart + 1]?.includes('<div key={item._id}')) {
  console.log('이미 래퍼 있음, 스킵');
} else {
  // mapStart 다음에 div 래퍼 삽입
  const indent = '              ';
  lines.splice(mapStart + 1, 0,
    `${indent}<div key={item._id} style={{ flexShrink: 0, position: 'relative' }}>`
  );
  
  // mapEnd는 이제 1 뒤로 밀렸음
  const newMapEnd = mapEnd + 1;
  
  // `)` 직전 (삼항 닫는 줄) 뒤에 삭제 버튼 + 래퍼 닫기 삽입
  // 현재: line newMapEnd = "            ))}"
  // 변경: newMapEnd 앞에 삭제 버튼 삽입, ")" 를 div 닫기로 변경
  
  const deleteBtn = [
    `                {isAdmin && (`,
    `                  <button`,
    `                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }}`,
    `                    style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,59,48,0.93)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}`,
    `                    title="삭제"`,
    `                  >`,
    `                    <X size={12} color="#fff" strokeWidth={3} />`,
    `                  </button>`,
    `                )}`,
    `              </div>`,
  ];
  
  // newMapEnd 위치의 줄이 "            ))}" 인지 확인
  console.log(`newMapEnd(${newMapEnd+1})줄:`, JSON.stringify(lines[newMapEnd]));
  
  // 삭제 버튼을 newMapEnd 바로 앞에 삽입
  lines.splice(newMapEnd, 0, ...deleteBtn);
  console.log('✅ 카드 삭제 버튼 추가');
}

writeFileSync(file, lines.join('\n'), 'utf8');
console.log('✅ 저장 완료. 줄수:', lines.length);
