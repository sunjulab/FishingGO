const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. API 응답에 불필요한 내부 필드(_v, __v, createdAt 등) 포함
console.log("\n=== 1. __v / internal 필드 응답 포함 ===");
const hasLean = (content.match(/\.lean\(\)/g) || []).length;
const hasToObject = (content.match(/\.toObject\(\)/g) || []).length;
console.log("  .lean() 호출:", hasLean + "개");
console.log("  .toObject() 호출:", hasToObject + "개");

// 2. GraphQL 또는 내부 디버그 인터페이스
console.log("\n=== 2. 내부 디버그/graphql 인터페이스 ===");
lines.forEach((line, i) => {
  if (/graphql|playground|voyager|introspection/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 3. 미사용 엔드포인트 탐색 (test, demo, sample)
console.log("\n=== 3. 미사용/테스트 엔드포인트 ===");
lines.forEach((line, i) => {
  if (/app\.(get|post|put|delete|patch).*['"](\/test|\/demo|\/sample|\/mock|\/debug|\/dev)/.test(line) &&
      !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 4. Content-Type 검증 없는 파일 업로드
console.log("\n=== 4. 파일 업로드 MIME 검증 ===");
lines.forEach((line, i) => {
  if (/multer|upload\.|fileFilter|mimetype/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 5. 이메일 발송 API 스팸 (rate limit 없음)
console.log("\n=== 5. 이메일/SMS 발송 rate limit ===");
lines.forEach((line, i) => {
  if (/sendMail|sms\.send|nodemailer|send.*otp|otp.*send/.test(line) &&
      /app\.(post|get)/.test(lines[Math.max(0, i-5)] + lines[Math.max(0, i-3)] + line)) {
    const route = lines.slice(Math.max(0, i-8), i).reverse().find(l => /app\.(post|get)/.test(l));
    if (route) {
      const hasLimit = /Limiter|rateLimit/.test(route);
      console.log("  L" + (i+1) + ": " + line.trim().slice(0, 70) + " | rate: " + (hasLimit ? "있음" : "없음"));
    }
  }
});

// 6. 비밀번호 비교 시 타이밍 공격
console.log("\n=== 6. 비밀번호 비교 — 타이밍 공격 ===");
lines.forEach((line, i) => {
  if (/password.*===|===.*password|password.*==|==.*password/.test(line) &&
      !/bcrypt|hash|compare/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

console.log("\n=== R27 완료 ===");
