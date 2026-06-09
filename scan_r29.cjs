const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. 갤러리/스토리 게시글 content 길이 제한
console.log("\n=== 1. 갤러리/스토리 content 길이 ===");
lines.forEach((line, i) => {
  if (/app\.(post|put).*(story|stories|gallery|photo)/.test(line) && !line.trim().startsWith("//")) {
    const next15 = lines.slice(i, i+15).join("\n");
    const hasLimit = /content.*length.*>|title.*length.*>|FIX.*LEN/.test(next15);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | len:" + hasLimit);
  }
});

// 2. 조황기록 memo 길이 제한
console.log("\n=== 2. 조황기록 memo 길이 ===");
lines.forEach((line, i) => {
  if (/app\.post.*records|app\.put.*records/.test(line) && !line.trim().startsWith("//")) {
    const next15 = lines.slice(i, i+15).join("\n");
    const hasMemoLimit = /memo.*length|FIX.*memo|memo.*MAX/.test(next15);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | memo제한:" + hasMemoLimit);
  }
});

// 3. AI 코치 요청 메시지 길이
console.log("\n=== 3. AI Coach 요청 길이 ===");
lines.forEach((line, i) => {
  if (/app\.(post|get).*ai.*coach|api.*coach|aiCoach/.test(line) && !line.trim().startsWith("//")) {
    const next10 = lines.slice(i, i+10).join("\n");
    const hasLimit = /message.*length|FIX.*AI|MAX.*msg/.test(next10);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | 길이:" + hasLimit);
  }
});

// 4. 이벤트 참가 API rate limit
console.log("\n=== 4. 이벤트/경품 참가 rate limit ===");
lines.forEach((line, i) => {
  if (/app\.post.*event|app\.post.*contest|app\.post.*entry/.test(line) && !line.trim().startsWith("//")) {
    const hasLimit = /Limiter|rateLimit/.test(line);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | rate:" + hasLimit);
  }
});

// 5. 닉네임/이름 특수문자 검증
console.log("\n=== 5. 닉네임 특수문자 검증 ===");
lines.forEach((line, i) => {
  if (/name.*regex|regex.*name|namePattern|nameCheck|FIX-NAME/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 6. MongoDB URI 노출 체크
console.log("\n=== 6. MongoDB URI 응답 노출 ===");
lines.forEach((line, i) => {
  if (/MONGO_URI|MONGO_PASS|mongodb:\/\//.test(line) && /res\.json|res\.send/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " ← 노출 위험!");
  }
});

console.log("\n=== R29 완료 ===");
