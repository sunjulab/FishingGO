// fix_r23_inline.cjs - Round 23 fixes
const fs = require("fs");
const { execSync } = require("child_process");
const FILE = "server/index.js";

function check() {
  try { execSync(`node --check ${FILE}`, { stdio: "pipe" }); return true; }
  catch (e) { console.error("Syntax error:", e.stderr?.toString().slice(0, 200)); return false; }
}

const raw = fs.readFileSync(FILE, "utf8");
const normalized = raw.replace(/\r\n/g, "\n");

// Fix 1: 전역 ADMIN_EMAIL_LIST 상수화
const insertPoint = "const LEVEL_CONFIG_SV = [";
if (!normalized.includes("ADMIN_EMAIL_LIST") && normalized.includes(insertPoint)) {
  const patch = normalized.replace(insertPoint,
    "// FIX-ADMIN-EMAIL-CONST: 관리자 이메일 전역 상수화\n" +
    "const ADMIN_EMAIL_PRIMARY = process.env.ADMIN_EMAIL || 'sunjulab@gmail.com';\n" +
    "const ADMIN_EMAIL_ALT = process.env.ADMIN_EMAIL_ALT || 'sunjulab.k@gmail.com';\n" +
    "const ADMIN_EMAIL_LIST = new Set([ADMIN_EMAIL_PRIMARY, ADMIN_EMAIL_ALT]);\n\n" +
    insertPoint
  );
  fs.writeFileSync(FILE, patch.replace(/\r?\n/g, "\r\n"), "utf8");
  if (check()) {
    console.log("OK: ADMIN_EMAIL_LIST 전역 상수 추가");
  } else {
    fs.writeFileSync(FILE, raw, "utf8");
    console.log("FAIL: rollback");
    process.exit(1);
  }
} else {
  console.log("SKIP: already has ADMIN_EMAIL_LIST or insertPoint not found");
}

// Fix 2: adminEmails 중복 선언 교체
const raw2 = fs.readFileSync(FILE, "utf8");
const n2 = raw2.replace(/\r\n/g, "\n");
const oldPattern = "  const adminEmails = [ADMIN_EMAIL, 'sunjulab.k@gmail.com'];";
const newPattern = "  const adminEmails = [...ADMIN_EMAIL_LIST]; // FIX-ADMIN-EMAIL-CONST";
const count = (n2.split(oldPattern).length - 1);
if (count > 0) {
  const p2 = n2.split(oldPattern).join(newPattern);
  fs.writeFileSync(FILE, p2.replace(/\r?\n/g, "\r\n"), "utf8");
  if (check()) {
    console.log("OK: adminEmails 교체 " + count + "건");
  } else {
    fs.writeFileSync(FILE, raw2, "utf8");
    console.log("FAIL: adminEmails rollback");
  }
} else {
  console.log("SKIP: adminEmails pattern not found in file");
}

const final = fs.readFileSync(FILE, "utf8").replace(/\r\n/g, "\n");
console.log("\n--- 확인 ---");
console.log("ADMIN_EMAIL_LIST:", final.includes("ADMIN_EMAIL_LIST"));
console.log("FIX-ADMIN-EMAIL-CONST:", (final.match(/FIX-ADMIN-EMAIL-CONST/g)||[]).length + "개");
console.log("남은 하드코딩:", (final.match(/sunjulab\.k@gmail\.com/g)||[]).length + "개 (0이 목표)");
