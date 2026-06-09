// scan_r23b.cjs - R23 추가: 반환 데이터 최소화 상세 점검
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. 사용자 전체 목록 반환 API (관리자용)
console.log('\n=== 1. 사용자 전체 목록 반환 ===');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return;
  if (/User\.find\(\s*\{?\s*\}?\s*\)/.test(line) || /User\.find\(\s*\)/.test(line)) {
    const next5 = lines.slice(i, i + 5).join('\n');
    const hasSelect = /\.select\(/.test(line + next5);
    console.log(`  L${i+1}: ${line.trim().slice(0, 80)} | select: ${hasSelect ? '✅' : '❌'}`);
  }
});

// 2. res.json(user) 패턴 — user 전체 객체 반환
console.log('\n=== 2. user 전체 객체 직접 반환 ===');
lines.forEach((line, i) => {
  // res.json(user) 또는 res.json({ user }) 패턴 중 password 미삭제
  if (/res\.json\(\s*(user|u)\s*\)|res\.json\(\s*\{\s*\.\.\.user/.test(line)) {
    const prev5 = lines.slice(Math.max(0, i - 5), i).join('\n');
    const hasPasswordDelete = /delete.*password|password.*delete/.test(prev5);
    console.log(`  L${i+1}: ${line.trim().slice(0, 80)} | pass삭제: ${hasPasswordDelete ? '✅' : '❌'}`);
  }
});

// 3. /api/admin/users 또는 /api/users 관리자 API — password 필드
console.log('\n=== 3. 관리자 user 조회 password 포함 ===');
lines.forEach((line, i) => {
  if (/api\/admin.*users|api\/users/.test(line) && /app\.get/.test(line)) {
    const next20 = lines.slice(i, i + 20).join('\n');
    const hasPassFilter = /select|password.*false|-password|delete.*password/.test(next20);
    console.log(`  L${i+1}: ${line.trim().slice(0, 80)} | pass필터: ${hasPassFilter ? '✅' : '❌'}`);
  }
});

// 4. 에러 핸들러 전역 (마지막 미들웨어)
console.log('\n=== 4. 전역 에러 핸들러 ===');
lines.forEach((line, i) => {
  if (/app\.use\(.*err|app\.use.*error.*middleware|errorHandler/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 80)}`);
  }
});

// 5. 하드코딩 관리자 이메일 노출
console.log('\n=== 5. 관리자 이메일 하드코딩 ===');
lines.forEach((line, i) => {
  if (/@.*\.com.*admin|admin.*@.*\.com/.test(line) && !line.trim().startsWith('//') && /const|let|var|=/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 80)}`);
  }
});

console.log('\n=== R23b 완료 ===');
