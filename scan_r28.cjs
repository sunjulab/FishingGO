const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. 크루 description 최대 길이 제한
console.log("\n=== 1. 크루 description 최대 길이 ===");
lines.forEach((line, i) => {
  if (/description/.test(line) && /req\.body|trim|slice|length/.test(line) && !line.trim().startsWith("//")) {
    const ctx = lines.slice(Math.max(0,i-2), i+3).join("\n");
    if (/crew|Crew|POST.*crews|PUT.*crews/.test(ctx)) {
      console.log("  L" + (i+1) + ": " + line.trim().slice(0, 90));
    }
  }
});
// 크루 생성/수정 라우트 주변
lines.forEach((line, i) => {
  if (/app\.post.*crews|app\.put.*crews/.test(line) && !line.trim().startsWith("//")) {
    const next15 = lines.slice(i, i+15).join("\n");
    const hasDescLimit = /description.*slice|description.*length|desc.*MAX|MAX.*desc/.test(next15);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | desc제한: " + (hasDescLimit ? "있음" : "없음"));
  }
});

// 2. 게시글 content 최대 길이
console.log("\n=== 2. 게시글 content 최대 길이 ===");
lines.forEach((line, i) => {
  if (/app\.post.*\/api\/community\/posts/.test(line) && !line.trim().startsWith("//")) {
    const next20 = lines.slice(i, i+20).join("\n");
    const hasContentLimit = /content.*slice|content.*length.*>|MAX.*content|content.*MAX/.test(next20);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | content제한: " + (hasContentLimit ? "있음" : "없음"));
  }
});

// 3. 결제 tier 업데이트 atomic 처리
console.log("\n=== 3. 결제 tier 업데이트 atomic ===");
lines.forEach((line, i) => {
  if (/tier.*update|updateOne.*tier|findByIdAndUpdate.*tier|tier.*Pro|tier.*VVIP/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 90));
  }
});

// 4. 소켓 이벤트에서 외부 URL fetch
console.log("\n=== 4. 소켓 이벤트 내 외부 fetch ===");
lines.forEach((line, i) => {
  if (/socket\.on/.test(line)) {
    const block = lines.slice(i, i+20).join("\n");
    if (/fetch\(|axios\.|http\.get|https\.get|require.*http/.test(block)) {
      console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
    }
  }
});

// 5. $where/$function MongoDB 연산자 (이미 확인됐지만 재확인)
console.log("\n=== 5. 위험 MongoDB 연산자 ===");
const hasWhere = content.includes("$where");
const hasFunction = content.includes("$function");
const hasMapReduce = content.includes("mapReduce");
console.log("  $where:", hasWhere ? "발견!" : "없음");
console.log("  $function:", hasFunction ? "발견!" : "없음");
console.log("  mapReduce:", hasMapReduce ? "발견!" : "없음");

// 6. 공지사항 content 최대 길이
console.log("\n=== 6. 공지사항 content 길이 제한 ===");
lines.forEach((line, i) => {
  if (/app\.post.*notices|app\.put.*notices/.test(line) && !line.trim().startsWith("//")) {
    const next15 = lines.slice(i, i+15).join("\n");
    const hasLimit = /content.*length|title.*length|slice.*content/.test(next15);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | 길이제한: " + (hasLimit ? "있음" : "없음"));
  }
});

console.log("\n=== R28 스캔 완료 ===");
