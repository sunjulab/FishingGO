const fs = require("fs");
const FILE = "server/index.js";
const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");
const lines = n.split("\n");

// L4245: if (!author) return res.status(400)... 이전에 memo 길이 체크 추가
const galleryIdx = lines.findIndex(l => /app\.post.*gallery/.test(l));
console.log("Gallery POST at L" + (galleryIdx+1));

const authorCheckIdx = lines.findIndex((l, i) => i > galleryIdx && i < galleryIdx+15 && l.includes("if (!author)"));
console.log("author check at L" + (authorCheckIdx+1));

if (authorCheckIdx >= 0) {
  lines.splice(authorCheckIdx, 0,
    "    // FIX-GALLERY-FIELD-LEN: 갤러리 포스트 필드 길이 제한 (DoS 방어)",
    "    if (memo && typeof memo === 'string' && memo.length > 500) return res.status(400).json({ error: '\uba54\ubaa8\ub294 500\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-GALLERY-FIELD-LEN",
    "    if (shipName && typeof shipName === 'string' && shipName.length > 100) return res.status(400).json({ error: '\uc120\uc0c1\uba85\uc740 100\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-GALLERY-FIELD-LEN",
    "    if (phone && typeof phone === 'string' && phone.length > 20) return res.status(400).json({ error: '\uc804\ud654\ubc88\ud638\ub294 20\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-GALLERY-FIELD-LEN"
  );
  const patched = lines.join("\n");
  fs.writeFileSync(FILE, patched.replace(/\r?\n/g, "\r\n"), "utf8");
  console.log("OK: FIX-GALLERY-FIELD-LEN applied");
} else {
  console.log("SKIP: author check not found");
}

const final = fs.readFileSync(FILE, "utf8");
console.log("FIX-GALLERY-FIELD-LEN:", final.includes("FIX-GALLERY-FIELD-LEN"));
