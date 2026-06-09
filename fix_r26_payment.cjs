const fs = require("fs");
const { execSync } = require("child_process");
const FILE = "server/index.js";

function check() {
  // node --check has encoding issue with korean path, use require instead
  try {
    const src = fs.readFileSync(FILE, "utf8");
    // basic bracket balance check
    const opens = (src.match(/\{/g) || []).length;
    const closes = (src.match(/\}/g) || []).length;
    if (Math.abs(opens - closes) > 5) return false;
    return true;
  } catch { return false; }
}

const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");

// Fix: 결제 금액 허용 목록(PRICE_MAP) 서버측 검증 추가
const FROM = "    const safeAmount = Number(amount); if (!Number.isFinite(safeAmount) || safeAmount <= 0) return r";

if (!n.includes("PAYMENT_ALLOWED_AMOUNTS") && n.includes("const safeAmount = Number(amount); if (!Number.isFinite(safeAmount) || safeAmount <= 0)")) {
  // 결제 허용 금액 상수 + 검증 로직 추가
  const inserted = n.replace(
    "    const safeAmount = Number(amount); if (!Number.isFinite(safeAmount) || safeAmount <= 0) return res.status(400).json({ error: '유효하지 않은 금액' }); // FIX-PAYMENT-AMOUNT",
    "    const PAYMENT_ALLOWED_AMOUNTS = new Set([990, 1900, 3900, 4900, 5900, 9900, 14900, 19900, 29900, 39900, 49900, 99900]); // FIX-AMOUNT-WHITELIST: 허용 결제 금액 목록\n    const safeAmount = Number(amount); if (!Number.isFinite(safeAmount) || safeAmount <= 0) return res.status(400).json({ error: '유효하지 않은 금액' }); // FIX-PAYMENT-AMOUNT\n    if (!isAdmin && !PAYMENT_ALLOWED_AMOUNTS.has(safeAmount)) return res.status(400).json({ error: '허용되지 않은 결제 금액입니다.' }); // FIX-AMOUNT-WHITELIST"
  );
  if (inserted !== n) {
    fs.writeFileSync(FILE, inserted.replace(/\r?\n/g, "\r\n"), "utf8");
    console.log("OK: PAYMENT_ALLOWED_AMOUNTS whitelist added");
  } else {
    console.log("SKIP: exact pattern not found — trying fallback");
    // 다른 패턴 시도
    const lines = n.split("\n");
    const idx = lines.findIndex(l => l.includes("const safeAmount = Number(amount)") && l.includes("isFinite"));
    if (idx >= 0) {
      console.log("Found at L" + (idx+1) + ": " + lines[idx].trim().slice(0, 100));
    }
  }
} else {
  console.log("INFO: PAYMENT_ALLOWED_AMOUNTS already exists or pattern not found");
  const lines = n.split("\n");
  const idx = lines.findIndex(l => l.includes("const safeAmount = Number(amount)"));
  if (idx >= 0) console.log("Found at L" + (idx+1) + ": " + lines[idx].trim().slice(0, 100));
}
