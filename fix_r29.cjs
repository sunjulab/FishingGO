const fs = require("fs");
const FILE = "server/index.js";
const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");
const lines = n.split("\n");

let fixes = 0;

// Fix 1: 스토리 content 길이 제한 (L4519 = idx 4518)
// "    if (!image) return res.status(400).json..." 바로 다음에 추가
const storyAuthIdx = lines.findIndex(l => l.includes("if (!image) return res.status(400)") && l.includes("필수"));
if (storyAuthIdx >= 0) {
  console.log("Story image check at L" + (storyAuthIdx+1));
  lines.splice(storyAuthIdx + 1, 0,
    "    if (content && typeof content === 'string' && content.length > 300) return res.status(400).json({ error: '\uc2a4\ud1a0\ub9ac \ub0b4\uc6a9\uc740 300\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-STORY-CONTENT-LEN"
  );
  fixes++;
  console.log("OK: FIX-STORY-CONTENT-LEN");
} else {
  // fallback: 다른 패턴 탐색
  const storyIdx = lines.findIndex(l => /app\.post.*stories/.test(l));
  if (storyIdx >= 0) {
    const nextFew = lines.slice(storyIdx, storyIdx + 10);
    const imgCheckIdx = nextFew.findIndex(l => l.includes("if (!image)"));
    if (imgCheckIdx >= 0) {
      const absIdx = storyIdx + imgCheckIdx;
      lines.splice(absIdx + 1, 0,
        "    if (content && typeof content === 'string' && content.length > 300) return res.status(400).json({ error: '\uc2a4\ud1a0\ub9ac \ub0b4\uc6a9\uc740 300\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-STORY-CONTENT-LEN"
      );
      fixes++;
      console.log("OK: FIX-STORY-CONTENT-LEN (fallback, L" + (absIdx+2) + ")");
    } else {
      console.log("SKIP: story image check not found");
    }
  }
}

// Fix 2: 조황기록 memo 길이 제한
// L4444: const { author, fish, ... memo, ... } = req.body; 이후
const recordBodyIdx = lines.findIndex(l => l.includes("const { author, fish,") && l.includes("memo,"));
if (recordBodyIdx >= 0) {
  console.log("Record body destructure at L" + (recordBodyIdx+1));
  // 이후에 memo 길이 체크 추가 (author_email 추출 이후)
  const authorEmailIdx = lines.findIndex((l, i) => i > recordBodyIdx && i < recordBodyIdx + 10 && l.includes("author_email = tp.email"));
  if (authorEmailIdx >= 0) {
    lines.splice(authorEmailIdx + 1, 0,
      "    if (memo && typeof memo === 'string' && memo.length > 500) return res.status(400).json({ error: '\uba54\ubaa8\ub294 500\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-MEMO-LEN"
    );
    fixes++;
    console.log("OK: FIX-MEMO-LEN at L" + (authorEmailIdx+2));
  }
}

const patched = lines.join("\n");
fs.writeFileSync(FILE, patched.replace(/\r?\n/g, "\r\n"), "utf8");
console.log("\nTotal fixes:", fixes);

const final = fs.readFileSync(FILE, "utf8");
console.log("FIX-STORY-CONTENT-LEN:", final.includes("FIX-STORY-CONTENT-LEN"));
console.log("FIX-MEMO-LEN:", final.includes("FIX-MEMO-LEN"));
