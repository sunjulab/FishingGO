// fix-modal-position.mjs — 모달 위치 수정 (Fragment 방식)
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
const raw = readFileSync(file, 'utf8');
const lf = raw.replace(/\r\n/g, '\n');

// return ( 의 첫 요소를 <> Fragment로 감싸기
const OLD_RETURN = `  return (\n    <div className="page-container"`;
const NEW_RETURN = `  return (\n    <>\n    <div className="page-container"`;

// 파일 끝 구조 찾기
// 현재: 모달 끝 → \n  );\n}
// 변경: 모달 끝 → \n    </>\n  );\n}
const OLD_END = `\n  );\n}`;
// 마지막 발생에만 적용
const lastIdx = lf.lastIndexOf(OLD_END);

if (!lf.includes(OLD_RETURN)) {
  console.error('❌ return 패턴 못찾음');
  process.exit(1);
}
if (lastIdx === -1) {
  console.error('❌ 끝 패턴 못찾음');
  process.exit(1);
}

let result = lf.replace(OLD_RETURN, NEW_RETURN);
// 마지막 OLD_END → NEW_END
result = result.slice(0, result.lastIndexOf(OLD_END)) + `\n    </>\n  );\n}`;

// CRLF 복원
result = result.replace(/\n/g, '\r\n');
writeFileSync(file, result, 'utf8');
console.log('✅ Fragment 감싸기 완료. 줄수:', result.split('\n').length);
