const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. X-Forwarded-For 헤더 신뢰 취약점 (IP spoofing)
console.log("\n=== 1. X-Forwarded-For IP spoofing ===");
lines.forEach((line, i) => {
  if (/x-forwarded-for/i.test(line) && !line.trim().startsWith("//")) {
    const hasClean = /split.*,.*\[0\]|trim\(\)|String\(/.test(line);
    console.log(`  L${i+1}: ${line.trim().slice(0, 90)} | 정제: ${hasClean ? "✅" : "❌"}`);
  }
});

// 2. Helmet 또는 보안 헤더 설정 여부
console.log("\n=== 2. Helmet/보안 헤더 설정 ===");
const hasHelmet = content.includes("helmet");
const hasXFrame = /X-Frame-Options|x-frame/i.test(content);
const hasHSTS = /Strict-Transport|hsts/i.test(content);
const hasXContent = /X-Content-Type|nosniff/i.test(content);
console.log(`  helmet: ${hasHelmet ? "✅" : "❌"}`);
console.log(`  X-Frame-Options: ${hasXFrame ? "✅" : "❌"}`);
console.log(`  HSTS: ${hasHSTS ? "✅" : "❌"}`);
console.log(`  X-Content-Type-Options: ${hasXContent ? "✅" : "❌"}`);

// 3. req.body 크기 제한
console.log("\n=== 3. req.body 크기 제한 ===");
lines.forEach((line, i) => {
  if (/express\.json|bodyParser\.json|express\.urlencoded/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 90)}`);
  }
});

// 4. setInterval/setTimeout 무한 누적 여부
console.log("\n=== 4. 타이머 누수 (clearInterval 없는 setInterval) ===");
let setCount = 0; let clearCount = 0;
lines.forEach((line, i) => {
  if (/setInterval\(/.test(line) && !line.trim().startsWith("//")) setCount++;
  if (/clearInterval\(/.test(line) && !line.trim().startsWith("//")) clearCount++;
});
console.log(`  setInterval: ${setCount}개, clearInterval: ${clearCount}개`);

// 5. 대용량 배열 응답 제한
console.log("\n=== 5. 응답 배열 limit 없는 find() ===");
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("//")) return;
  if (/\.find\(.*\)/.test(line) && !/\.limit\(/.test(line) && /res\.json|return.*json/.test(lines.slice(i, i+3).join("\n"))) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 90)}`);
  }
});

// 6. 미들웨어 순서 — authLimiter가 auth 엔드포인트 앞에 있는지
console.log("\n=== 6. authLimiter 적용 현황 ===");
lines.forEach((line, i) => {
  if (/app\.post.*\/(login|register|signup|signin)/.test(line) && !line.trim().startsWith("//")) {
    const hasLimit = /authLimiter|rateLimit/.test(line);
    console.log(`  L${i+1}: ${line.trim().slice(0, 80)} | authLimiter: ${hasLimit ? "✅" : "❌"}`);
  }
});

console.log("\n=== R26 완료 ===");
