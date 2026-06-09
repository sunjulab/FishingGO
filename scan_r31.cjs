const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. Cache-Control 헤더 민감 API
console.log("\n=== 1. Cache-Control 헤더 민감 API ===");
const hasCacheControl = content.includes("Cache-Control") || content.includes("cache-control");
console.log("  Cache-Control 헤더:", hasCacheControl ? "있음" : "없음");
lines.forEach((line, i) => {
  if (/Cache-Control|cache-control/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 2. X-Forwarded-For trust — express trust proxy 설정
console.log("\n=== 2. express trust proxy 설정 ===");
const hasTrustProxy = content.includes("trust proxy") || content.includes("trustProxy") || content.includes("set('trust proxy'");
console.log("  trust proxy:", hasTrustProxy ? "있음" : "없음");
lines.forEach((line, i) => {
  if (/trust proxy|trustProxy/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 3. HTTP Parameter Pollution 최종 — 모든 파라미터 Array.isArray 체크
console.log("\n=== 3. HPP — 배열 파라미터 중복 처리 ===");
lines.forEach((line, i) => {
  if (/req\.query\.\w+/.test(line) && !/Array\.isArray|FIX-QUERY.*HPP|HPP/.test(line) && !line.trim().startsWith("//")) {
    const hasHppFix = /Array\.isArray/.test(lines.slice(Math.max(0, i-2), i+2).join("\n"));
    if (!hasHppFix) {
      const query = line.match(/req\.query\.(\w+)/);
      if (query && !["page", "limit", "sort", "skip"].includes(query[1])) {
        console.log("  L" + (i+1) + ": " + line.trim().slice(0, 90));
      }
    }
  }
});

// 4. 응답 압축 설정 레벨
console.log("\n=== 4. Compression 설정 ===");
lines.forEach((line, i) => {
  if (/compression\(|compress\(/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 5. 갤러리 memo 길이
console.log("\n=== 5. 갤러리 memo 길이 제한 ===");
lines.forEach((line, i) => {
  if (/app\.post.*gallery/.test(line) && !line.trim().startsWith("//")) {
    const next10 = lines.slice(i, i+10).join("\n");
    const hasMemoLimit = /memo.*length|FIX.*MEMO/.test(next10);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | memo제한:" + hasMemoLimit);
  }
});

console.log("\n=== R31 스캔 완료 ===");
