const fs = require("fs");
const FILE = "server/index.js";
const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");
const lines = n.split("\n");
const idx = 8066; // L8067 (0-indexed)

const oldLine = lines[idx];
console.log("OLD:", oldLine.trim().slice(0, 120));

// 새 라인: 허용 금액 whitelist 추가
const newLines = [
  "    // FIX-AMOUNT-WHITELIST: 결제 허용 금액 서버측 검증",
  "    const PAYMENT_ALLOWED_AMOUNTS = new Set([990, 1900, 3900, 4900, 5900, 9900, 14900, 19900, 29900, 39900, 49900, 99900]);",
  oldLine,  // 기존 safeAmount 라인 유지
  "    if (!isAdmin && !PAYMENT_ALLOWED_AMOUNTS.has(safeAmount)) return res.status(400).json({ error: '\ud5c8\uc6a9\ub418\uc9c0 \uc54a\ub294 \uacb0\uc81c \uae08\uc561\uc785\ub2c8\ub2e4.' }); // FIX-AMOUNT-WHITELIST"
];

lines.splice(idx, 1, ...newLines);
const patched = lines.join("\n");
fs.writeFileSync(FILE, patched.replace(/\r?\n/g, "\r\n"), "utf8");
console.log("Written. New L8067-8071:");
const nl = fs.readFileSync(FILE, "utf8").split("\n");
nl.slice(8065, 8073).forEach((l, i) => console.log((8066+i)+": "+l.trim().slice(0,100)));
