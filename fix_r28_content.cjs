const fs = require("fs");
const FILE = "server/index.js";
const raw = fs.readFileSync(FILE, "utf8");
const n = raw.replace(/\r\n/g, "\n");
const lines = n.split("\n");

let fixed = 0;

// Fix 1: 선상 배 홍보글 POST content 길이 제한
// L5646 이후에 content 길이 체크 추가
// "    if (shipName && typeof shipName === 'string' && shipName.length > 100)" 이후
const bizIdx = lines.findIndex(l => l.includes("FIX-BIZ-SHIPNAME-LEN") && l.includes("shipName.length > 100"));
if (bizIdx >= 0) {
  const phoneLine = lines[bizIdx + 1]; // phone 체크 라인
  console.log("Found bizIdx L" + (bizIdx+1));
  console.log("Next line:", phoneLine.trim().slice(0, 80));
  // phone 체크 다음에 content 길이 추가
  if (phoneLine && phoneLine.includes("phone") && phoneLine.includes(".length > 20")) {
    lines.splice(bizIdx + 2, 0,
      "    if (content && typeof content === 'string' && content.length > 3000) return res.status(400).json({ error: '\ub0b4\uc6a9\uc740 3000\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-BIZ-CONTENT-LEN"
    );
    fixed++;
    console.log("OK: FIX-BIZ-CONTENT-LEN (POST)");
  } else {
    console.log("SKIP: phone line pattern not found");
  }
}

// Fix 2: 선상 배 홍보글 PUT content 길이 제한
// L5821 부근 확인
const putBizIdx = lines.findIndex((l, i) => /app\.put.*community\/business\/:id/.test(l));
if (putBizIdx >= 0) {
  console.log("PUT biz at L" + (putBizIdx+1));
  const block = lines.slice(putBizIdx, putBizIdx + 15).join("\n");
  const hasContentLimit = /content.*length|FIX-BIZ-CONTENT/.test(block);
  console.log("PUT has content limit:", hasContentLimit);
  if (!hasContentLimit) {
    // content 추출 이후에 길이 제한 추가
    const bodyDestructIdx = lines.findIndex((l, i) => i > putBizIdx && i < putBizIdx + 20 && /const \{.*content/.test(l));
    if (bodyDestructIdx >= 0) {
      lines.splice(bodyDestructIdx + 1, 0,
        "    if (content && typeof content === 'string' && content.length > 3000) return res.status(400).json({ error: '\ub0b4\uc6a9\uc740 3000\uc790 \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' }); // FIX-BIZ-PUT-CONTENT-LEN"
      );
      fixed++;
      console.log("OK: FIX-BIZ-PUT-CONTENT-LEN");
    }
  }
}

const patched = lines.join("\n");
fs.writeFileSync(FILE, patched.replace(/\r?\n/g, "\r\n"), "utf8");
console.log("\nTotal fixed:", fixed);
console.log("FIX tags in file:", (patched.match(/FIX-BIZ.*LEN|FIX-NOTICE-PUT-LEN/g) || []).length);
