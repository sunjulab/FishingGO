const fs = require("fs");
const FILE = "server/index.js";
const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");
const lines = n.split("\n");

const idx = 4446; // 0-indexed L4447
const targetLine = lines[idx];
console.log("L4447:", targetLine.trim().slice(0, 80));

// 이 라인 앞에 memo 길이 체크 삽입
lines.splice(idx, 0,
  "    if (memo && typeof memo === 'string' && memo.length > 500) return res.status(400).json({ error: '\uba54\ubaa8\ub294 500\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-MEMO-LEN"
);

const patched = lines.join("\n");
fs.writeFileSync(FILE, patched.replace(/\r?\n/g, "\r\n"), "utf8");

const final = fs.readFileSync(FILE, "utf8");
console.log("FIX-MEMO-LEN:", final.includes("FIX-MEMO-LEN"));
console.log("Verify line:");
const vlines = final.replace(/\r\n/g, "\n").split("\n");
console.log("L4447:", vlines[4446].trim().slice(0, 80));
console.log("L4448:", vlines[4447].trim().slice(0, 80));
