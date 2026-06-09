const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. $where, $function 등 위험한 MongoDB 연산자 사용
console.log("\n=== 1. 위험한 MongoDB 연산자 ===");
lines.forEach((line, i) => {
  if (/\$where|\$function|\$expr.*\$function|\$mapReduce/.test(line) && !line.trim().startsWith("//")) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 90)}`);
  }
});

// 2. 응답에 민감 환경 변수 노출
console.log("\n=== 2. 환경변수 응답 노출 ===");
lines.forEach((line, i) => {
  if (/process\.env\.(?!NODE_ENV|PORT|MONGO|JWT|ADMIN|SEED|SMS|PORTONE|FCM)/.test(line) &&
      /res\.json|res\.send/.test(line) && !line.trim().startsWith("//")) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 90)}`);
  }
});

// 3. 장기 실행 동기 작업 (blocking)
console.log("\n=== 3. 동기 blocking 작업 ===");
lines.forEach((line, i) => {
  if (/execSync|readFileSync|writeFileSync|spawnSync/.test(line) && 
      !line.trim().startsWith("//") && !/\.cjs|fix_|scan_|security_watch/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 90)}`);
  }
});

// 4. 미검증 req.params.id 직접 DB 쿼리
console.log("\n=== 4. req.params 미검증 DB 직접 사용 ===");
lines.forEach((line, i) => {
  if (/findById\(req\.params|find.*req\.params|query.*req\.params/.test(line) &&
      !line.trim().startsWith("//")) {
    const prev5 = lines.slice(Math.max(0, i-5), i).join("\n");
    const hasValidation = /isValid|ObjectId|regex|test\(|typeof.*string/.test(prev5);
    if (!hasValidation) {
      console.log(`  L${i+1}: ${line.trim().slice(0, 90)} ← 사전 검증 없음`);
    }
  }
});

// 5. 무한 루프 위험 (while(true) or recursive without exit)
console.log("\n=== 5. 무한 루프 위험 ===");
lines.forEach((line, i) => {
  if (/while\s*\(\s*true\s*\)/.test(line) && !line.trim().startsWith("//")) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 90)}`);
  }
});

// 6. 토큰 revocation 체크 (JWT 블랙리스트 또는 pwdChangedCache)
console.log("\n=== 6. JWT revocation 체크 ===");
const hasPwdChangedCache = content.includes("pwdChangedCache");
const hasBlacklist = content.includes("tokenBlacklist") || content.includes("revokedTokens");
console.log(`  pwdChangedCache: ${hasPwdChangedCache ? "✅" : "❌"}`);
console.log(`  tokenBlacklist:  ${hasBlacklist ? "✅" : "❌"}`);

console.log("\n=== R25 탐색 완료 ===");
