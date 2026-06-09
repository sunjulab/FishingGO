const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. cron/schedule 작업 보안
console.log("\n=== 1. 예약/cron 작업 보안 ===");
lines.forEach((line, i) => {
  if (/setInterval|cron|schedule/.test(line) && !/\/\//.test(line.trim().slice(0, 2))) {
    if (/db\.|User\.|Post\.|Crew\./.test(lines.slice(i, i+5).join("\n"))) {
      console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
    }
  }
});

// 2. 불필요한 CORS 와일드 메서드
console.log("\n=== 2. CORS methods 설정 ===");
lines.forEach((line, i) => {
  if (/methods.*TRACE|methods.*CONNECT|methods.*OPTIONS.*TRACE/.test(line)) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 3. Cookie 보안 설정 (httpOnly, secure, sameSite)
console.log("\n=== 3. Cookie 보안 설정 ===");
const hasCookie = content.includes("cookie");
const hasHttpOnly = content.includes("httpOnly");
const hasSecureCookie = content.includes("secure: true");
const hasSameSite = content.includes("sameSite");
console.log("  cookie 사용:", hasCookie ? "있음" : "없음");
console.log("  httpOnly:", hasHttpOnly ? "있음" : "없음");
console.log("  secure:", hasSecureCookie ? "있음" : "없음");
console.log("  sameSite:", hasSameSite ? "있음" : "없음");

// 4. 공개 API에서 개인정보 과다 노출
console.log("\n=== 4. 공개 API 개인정보 노출 ===");
lines.forEach((line, i) => {
  if (/app\.get.*\/api\/user|app\.get.*\/api\/users/.test(line) && !line.trim().startsWith("//")) {
    const next10 = lines.slice(i, i+10).join("\n");
    const hasAuth = /jwt|verifyToken|authorization|Bearer/.test(next10);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | auth: " + (hasAuth ? "있음" : "없음"));
  }
});

// 5. 취약한 정규식 (ReDoS)
console.log("\n=== 5. 잠재적 ReDoS 패턴 ===");
lines.forEach((line, i) => {
  if (/new RegExp\(req\.|regex.*req\.|RegExp.*req\./.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 6. 크루 채팅 이미지 크기 제한
console.log("\n=== 6. 크루 채팅 이미지 크기 제한 ===");
lines.forEach((line, i) => {
  if (/imageData|chatImage|image.*chat|chat.*image/.test(line) &&
      /length|size|limit|MAX/.test(lines.slice(i, i+5).join("\n"))) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

console.log("\n=== R27b 완료 ===");
