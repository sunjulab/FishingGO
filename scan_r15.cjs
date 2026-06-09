// scan_r15.cjs - Final comprehensive security scan
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// ─── 1. req.query 파라미터 Array.isArray 방어 없는 곳 ─────────────────────────
console.log('\n=== 1. req.query 파라미터 string 변환 없이 직접 사용 ===');
const queryIssues = [];
lines.forEach((line, i) => {
  // req.query.X를 typeof 검증 없이 직접 Number(), parseInt(), .trim() 사용
  if (/req\.query\.\w+/.test(line) && 
      !/parseInt|Number|String\(|typeof|trim\(\)|safeQ|toString\(\)|Array\.isArray/.test(line) &&
      !/\/\/.*req\.query/.test(line)) {
    queryIssues.push({ line: i+1, content: line.trim().slice(0, 100) });
  }
});
console.log(`총 ${queryIssues.length}건`);
queryIssues.slice(0, 10).forEach(q => console.log(`  L${q.line}: ${q.content}`));

// ─── 2. parseInt 사용 중 범위 제한 없는 곳 ────────────────────────────────────
console.log('\n=== 2. parseInt/Number 사용 중 범위 제한 없는 곳 ===');
const parseIntIssues = [];
lines.forEach((line, i) => {
  if (/\bparseInt\(/.test(line) && !/Math\.(max|min)|isNaN|isFinite/.test(line) &&
      !/\/\/.*parseInt/.test(line) && !line.includes('radix')) {
    parseIntIssues.push({ line: i+1, content: line.trim().slice(0, 100) });
  }
});
console.log(`총 ${parseIntIssues.length}건`);
parseIntIssues.slice(0, 10).forEach(q => console.log(`  L${q.line}: ${q.content}`));

// ─── 3. req.body 필드 typeof 검증 없이 직접 사용 ───────────────────────────────
console.log('\n=== 3. req.body 파라미터 직접 MongoDB 쿼리 사용 ===');
const bodyIssues = [];
lines.forEach((line, i) => {
  // $where, $expr, $function, $regex 등 위험 연산자
  if (/\$where|\$function|\$expr.*req\.body|\$regex.*req\.body/.test(line)) {
    bodyIssues.push({ line: i+1, content: line.trim().slice(0, 100) });
  }
});
console.log(`총 ${bodyIssues.length}건`);
bodyIssues.forEach(q => console.log(`  L${q.line}: ${q.content}`));

// ─── 4. 소켓 이벤트 data 필드 미검증 사용 ────────────────────────────────────
console.log('\n=== 4. 소켓 data 필드 직접 DB 저장 ===');
const socketIssues = [];
let inSocketBlock = false;
lines.forEach((line, i) => {
  if (/io\.on\('connection'\)|socket\.on\(/.test(line)) inSocketBlock = true;
  if (inSocketBlock && /data\.\w+/.test(line) && 
      /\.create\(|\.save\(|\.insertOne\(|\.update/.test(line) &&
      !/toString|trim|slice|substring|typeof/.test(line)) {
    socketIssues.push({ line: i+1, content: line.trim().slice(0, 100) });
  }
});
console.log(`총 ${socketIssues.length}건`);
socketIssues.slice(0, 5).forEach(q => console.log(`  L${q.line}: ${q.content}`));

// ─── 5. 민감 응답에 no-cache 미적용 여부 ─────────────────────────────────────
console.log('\n=== 5. 민감 API no-cache 미적용 ===');
const noCacheIssues = [];
lines.forEach((line, i) => {
  if (/app\.get.*api\/user\/me|app\.get.*api\/admin|app\.post.*api\/auth\//.test(line)) {
    // 주변에 noCache 미들웨어가 있는지 확인
    const nextLine = lines[i+1] || '';
    const hasNoCache = line.includes('noCache') || nextLine.includes('noCache') ||
                       lines.slice(i, i+5).some(l => l.includes('no-store') || l.includes('noCache'));
    if (!hasNoCache) {
      noCacheIssues.push({ line: i+1, content: line.trim().slice(0, 80) });
    }
  }
});
console.log(`총 ${noCacheIssues.length}건 (단순 패턴 검사 — 미들웨어 체인 미분석)`);
noCacheIssues.slice(0, 5).forEach(q => console.log(`  L${q.line}: ${q.content}`));

// ─── 6. eval/Function 생성자 사용 여부 ────────────────────────────────────────
console.log('\n=== 6. eval/new Function 사용 ===');
const evalIssues = [];
lines.forEach((line, i) => {
  if (/\beval\s*\(|new\s+Function\s*\(/.test(line) && !/\/\/.*eval/.test(line)) {
    evalIssues.push({ line: i+1, content: line.trim().slice(0, 100) });
  }
});
console.log(`총 ${evalIssues.length}건`);
evalIssues.forEach(q => console.log(`  L${q.line}: ${q.content}`));

// ─── 7. process.env 직접 응답 노출 ───────────────────────────────────────────
console.log('\n=== 7. process.env 응답 노출 ===');
const envLeakIssues = [];
lines.forEach((line, i) => {
  if (/res\.json.*process\.env|JSON\.stringify.*process\.env/.test(line)) {
    envLeakIssues.push({ line: i+1, content: line.trim().slice(0, 100) });
  }
});
console.log(`총 ${envLeakIssues.length}건`);
envLeakIssues.forEach(q => console.log(`  L${q.line}: ${q.content}`));

console.log('\n=== 전수조사 완료 ===');
