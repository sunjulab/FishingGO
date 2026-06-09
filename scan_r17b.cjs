// scan_r17b.cjs - 추가 취약점 탐색
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. 관리자 이메일 하드코딩 비교 (isAdminToken 함수 우회 가능성)
console.log('\n=== 1. 관리자 이메일 하드코딩 비교 ===');
lines.forEach((line, i) => {
  // isAdminToken 사용 대신 직접 이메일 비교
  if (/email.*===.*admin|admin.*===.*email|email.*includes.*admin/.test(line) && 
      !line.includes('isAdminToken') && !line.includes('adminEmails') &&
      !line.includes('//')) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 2. 회원 탈퇴 API 존재 여부 + 타인 탈퇴 방어
console.log('\n=== 2. 회원 탈퇴 API ===');
lines.forEach((line, i) => {
  if (/api.*withdraw|api.*delete.*user|api.*deactivate|api.*resign/.test(line) ||
      /User\.findOneAndDelete|User\.deleteOne/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 3. 파일 경로 조작 (path traversal)
console.log('\n=== 3. 경로 순회 위험 ===');
lines.forEach((line, i) => {
  if (/path\.join.*req\.|readFile.*req\.|sendFile.*req\.|fs\..*req\./.test(line) && !/normalize|resolve/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 4. 인증 없는 GET API 중 민감 데이터 반환 (users list)
console.log('\n=== 4. 인증 없는 전체 사용자 목록 조회 ===');
lines.forEach((line, i) => {
  if (/User\.find\(\s*\)/.test(line) || /User\.find\(\{\s*\}\)/.test(line)) {
    const prevLines = lines.slice(Math.max(0, i-20), i).join('\n');
    const hasAuth = /jwt\.verify|isAdminToken|verifyToken/.test(prevLines);
    if (!hasAuth) {
      console.log(`  L${i+1}: ${line.trim().slice(0, 100)} [WARNING: no auth in prev 20 lines]`);
    }
  }
});

// 5. 댓글/포스트에서 author_email이 JWT가 아닌 body에서 오는 곳
console.log('\n=== 5. author_email body 직접 사용 (IDOR) ===');
lines.forEach((line, i) => {
  if (/author_email.*req\.body/.test(line) && !line.includes('//')) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 6. 소켓에서 verifiedUser 없이 DB 업데이트
console.log('\n=== 6. 소켓 비인증 DB 업데이트 ===');
let inSocketConn = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/io\.on.*connection/.test(line)) inSocketConn = true;
  if (inSocketConn && /await.*\.save\(|await.*\.update|await.*\.create/.test(line)) {
    const prevLines = lines.slice(Math.max(0, i-30), i).join('\n');
    if (!/verifiedUser/.test(prevLines)) {
      console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
    }
  }
}

console.log('\n=== R17 탐색 완료 ===');
