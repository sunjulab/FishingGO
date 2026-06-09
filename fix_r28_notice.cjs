const fs = require("fs");
const FILE = "server/index.js";
const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");
const lines = n.split("\n");

// L5521: const { title, content, image, images, isPopup } = req.body;
// L5522: if (!title || !content) return ...
// -> 5521 다음에 길이 제한 추가

const idx = 5521; // 0-indexed: 5520 (L5521)
const targetLine = lines[5520]; // "    const { title, content, image, images, isPopup } = req.body;"
const nextLine = lines[5521]; // "    if (!title || !content) ..."

console.log("L5521:", targetLine.trim().slice(0, 80));
console.log("L5522:", nextLine.trim().slice(0, 80));

if (targetLine.includes("title, content, image, images, isPopup") && nextLine.includes("if (!title || !content)")) {
  const newLines = [
    targetLine,
    "    // FIX-NOTICE-PUT-LEN: PUT 수정 시 길이 제한 (POST와 동일 기준 적용)",
    "    if (typeof title === 'string' && title.length > 100) return res.status(400).json({ error: '\uc81c\ubaa9\uc740 100\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-NOTICE-PUT-LEN",
    "    if (typeof content === 'string' && content.length > 5000) return res.status(400).json({ error: '\ub0b4\uc6a9\uc740 5000\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-NOTICE-PUT-LEN",
    nextLine,
  ];
  lines.splice(5520, 2, ...newLines);
  const patched = lines.join("\n");
  fs.writeFileSync(FILE, patched.replace(/\r?\n/g, "\r\n"), "utf8");
  console.log("OK: FIX-NOTICE-PUT-LEN 적용");
} else {
  console.log("SKIP: pattern not matched");
}
