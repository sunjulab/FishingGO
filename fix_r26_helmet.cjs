const fs = require("fs");
const { execSync } = require("child_process");
const FILE = "server/index.js";
const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");

const from = "    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },\n    crossOriginEmbedderPolicy: false })); // CSP는 SPA 프론트 판단에 맡김으로 off";
const to = "    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },\n    xContentTypeOptions: true, // FIX-NOSNIFF: X-Content-Type-Options: nosniff\n    frameguard: { action: 'deny' }, // FIX-XFRAME: X-Frame-Options: DENY\n    crossOriginEmbedderPolicy: false })); // CSP는 SPA 프론트 판단에 맡김으로 off";

if (n.includes(from)) {
  const patched = n.replace(from, to);
  fs.writeFileSync(FILE, patched.replace(/\r?\n/g, "\r\n"), "utf8");
  try { execSync("node --check " + FILE, { stdio: "pipe" }); console.log("OK: FIX-NOSNIFF + FIX-XFRAME applied"); }
  catch (e) { fs.writeFileSync(FILE, raw, "utf8"); console.log("FAIL: rollback"); }
} else {
  console.log("SKIP: pattern not found");
  // 현재 helmet 설정 확인
  const helmetLine = n.split("\n").find(l => l.includes("helmet({"));
  console.log("Current helmet line:", helmetLine?.trim().slice(0, 100));
}
