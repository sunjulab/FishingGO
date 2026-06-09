const fs = require("fs");
const FILE = "server/index.js";
const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");
const lines = n.split("\n");

// L4447 (idx 4446): if (!author || !author_email || !fish) 이후 memo 체크 추가
const idx = lines.findIndex(l => l.includes("if (!author || !author_email || !fish)") && l.includes("어종 필수"));
if (idx >= 0) {
  lines.splice(idx, 0,
    "    if (memo && typeof memo === 'string' && memo.length > 500) return res.status(400).json({ error: '\uba54\ubaa8\ub294 500\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-MEMO-LEN"
  );
  const patched = lines.join("\n");
  fs.writeFileSync(FILE, patched.replace(/\r?\n/g, "\r\n"), "utf8");
  console.log("OK: FIX-MEMO-LEN (L" + (idx+1) + ")");
} else {
  // 대안: L4447 정확한 위치 찾기
  const altIdx = lines.findIndex(l => l.includes("if (!author || !author_email || !fish)"));
  console.log("alt idx:", altIdx, altIdx >= 0 ? lines[altIdx].trim().slice(0, 80) : "not found");
}
const final = fs.readFileSync(FILE, "utf8");
console.log("FIX-MEMO-LEN:", final.includes("FIX-MEMO-LEN"));
