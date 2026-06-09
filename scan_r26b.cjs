const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. 전화번호 평문 저장 여부
console.log("\n=== 1. 전화번호 암호화 저장 ===");
const phoneSchema = lines.slice(0, 500).filter(l => /phone.*String|String.*phone/.test(l));
phoneSchema.forEach(l => console.log("  " + l.trim().slice(0, 80)));
const hasMaskedPhone = content.includes("maskPhone") || content.includes("phoneHash") || content.includes("encryptPhone");
console.log("  maskPhone 함수:", hasMaskedPhone ? "있음" : "없음 (평문 저장)");

// 2. mongoose session/transaction — 결제 관련
console.log("\n=== 2. Mongoose session/transaction 사용 ===");
const hasSession = content.includes("startSession") || content.includes("withTransaction");
console.log("  mongoose session:", hasSession ? "있음" : "없음");
lines.forEach((line, i) => {
  if (/startSession|withTransaction/.test(line)) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 3. 정적 파일 서빙 경로
console.log("\n=== 3. express.static 경로 ===");
lines.forEach((line, i) => {
  if (/express\.static|static\(/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 90));
  }
});

// 4. 인메모리 rate limit map 재시작 초기화 (설계 문제)
console.log("\n=== 4. 재시작 시 rate limit 초기화 여부 (설계 이슈) ===");
const rateMaps = (content.match(/const \w+Map = new Map/g) || []);
console.log("  메모리 Map 수:", rateMaps.length);
rateMaps.forEach(m => console.log("  " + m.trim()));

// 5. helmet xContentTypeOptions 현재 상태
console.log("\n=== 5. helmet 보안 헤더 현재 상태 ===");
lines.forEach((line, i) => {
  if (/app\.use\(helmet/.test(line)) {
    const block = lines.slice(i, i+6).join(" ");
    console.log("  frameguard:", /frameguard/.test(block) ? "있음" : "없음");
    console.log("  xContentTypeOptions:", /xContentTypeOptions/.test(block) ? "있음" : "없음");
    console.log("  현재 설정:", block.slice(0, 200));
  }
});

// 6. payment API 결제 금액 서버 검증
console.log("\n=== 6. 결제 금액 서버측 검증 ===");
lines.forEach((line, i) => {
  if (/payment.*amount|amount.*payment|price.*payment/.test(line) && /req\.body/.test(line) && !line.trim().startsWith("//")) {
    const next10 = lines.slice(i, i+10).join("\n");
    const hasVerify = /PRICE_MAP|validAmount|allowedAmount|priceTable/.test(next10);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | 서버검증: " + (hasVerify ? "있음" : "없음"));
  }
});

console.log("\n=== R26 완료 ===");
