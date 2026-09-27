
const fs = require("fs");
let code = fs.readFileSync("src/constants/fishingData.js", "utf8");

if (!code.includes("import { Lunar }")) {
  code = code.replace("import { TIDE_CALENDAR } from \"./tideCalendarData.js\";", "import { TIDE_CALENDAR } from \"./tideCalendarData.js\";\nimport { Lunar } from \"lunar-javascript\";");
}

const oldMathRegex = /const rawLunar = anchorLunar \+ diffDays;\r?\n\s*const cycled = \(\(rawLunar - 1\) % 29\.530588 \+ 29\.530588\) % 29\.530588;\r?\n\s*const lunarDay = Math\.floor\(cycled\) \+ 1;\r?\n\s*\/\/ FIX-TIDENUM v3:[\s\S]*?const tideNum = \(\(lunarDay \+ 6\) % 15\) \+ 1;/m;
const newMath = `const lunarD = Lunar.fromDate(targetDate);
    const lunarDay = lunarD.getDay();
    // FIX-LUNAR v4: Use lunar-javascript for exact lunar day matching BadaTime
    const tideNum = ((lunarDay + 6) % 15) + 1;`;

if (code.match(oldMathRegex)) {
  code = code.replace(oldMathRegex, newMath);
} else {
  console.log("Could not find the math block.");
}

code = code.replace("phase: realTide.phase,", "phase: tidePhase, // FIX: Ignore cached phase and calculate dynamically");

fs.writeFileSync("src/constants/fishingData.js", code, "utf8");
console.log("Patched fishingData.js properly!");

