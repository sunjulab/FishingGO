const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. 크루 password bcrypt 라운드
console.log("\n=== 1. 크루 password bcrypt 라운드 ===");
lines.forEach((line, i) => {
  if (/bcrypt\.hash.*password|password.*bcrypt/.test(line) && /crew|Crew/.test(lines.slice(Math.max(0,i-5),i+3).join("\n")) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 90));
  }
});

// 2. 구독 상태 검증 없이 VVIP 기능 접근
console.log("\n=== 2. VVIP 접근 권한 검증 ===");
lines.forEach((line, i) => {
  if (/vvip|VVIP|business_vip|BUSINESS_VIP/.test(line) && /app\.(get|post|put)/.test(line) && !line.trim().startsWith("//")) {
    const next5 = lines.slice(i, i+5).join("\n");
    const hasCheck = /tier|isVvip|vvipSlot|jwt|verifyToken/.test(next5);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | 체크:" + hasCheck);
  }
});

// 3. 환경변수 NODE_ENV production 체크 일관성
console.log("\n=== 3. NODE_ENV production 체크 ===");
const prodChecks = lines.filter(l => /NODE_ENV.*production|production.*NODE_ENV/.test(l) && !l.trim().startsWith("//"));
console.log("  총", prodChecks.length, "개 체크");
prodChecks.slice(0, 5).forEach(l => console.log("  " + l.trim().slice(0, 80)));

// 4. 비즈니스 갤러리 포스트 content 길이
console.log("\n=== 4. 갤러리 포스트 content 길이 ===");
lines.forEach((line, i) => {
  if (/app\.post.*gallery/.test(line) && !line.trim().startsWith("//")) {
    const next15 = lines.slice(i, i+15).join("\n");
    const hasLimit = /content.*length|title.*length|FIX.*LEN/.test(next15);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | len:" + hasLimit);
  }
});

// 5. 게시글 images 배열 URL validation
console.log("\n=== 5. images 배열 내 URL XSS 검증 ===");
lines.forEach((line, i) => {
  if (/images.*filter|filter.*images/.test(line) && !line.trim().startsWith("//")) {
    const hasUrlCheck = /startsWith|http|data:|MIME|mime/.test(lines.slice(i, i+3).join("\n"));
    if (!hasUrlCheck) {
      console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " ← URL 검증 없음");
    }
  }
});

console.log("\n=== R30 탐색 완료 ===");
