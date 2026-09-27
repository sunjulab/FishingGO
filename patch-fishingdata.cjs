
const fs = require("fs");
let code = fs.readFileSync("src/constants/fishingData.js", "utf8");

// 1. Add import if missing
if (!code.includes("import { Lunar }")) {
  code = code.replace("import { TIDE_CALENDAR } from \"./tideCalendarData.js\";", "import { TIDE_CALENDAR } from \"./tideCalendarData.js\";\nimport { Lunar } from \"lunar-javascript\";");
}

// 2. Replace the math logic with Lunar logic
const oldMathRegex = /const anchor = new Date[\s\S]*?const tideNum = \(\(lunarDay \+ 6\) % 15\) \+ 1;/m;
const newMath = `const lunarD = Lunar.fromDate(targetDate);
  const lunarDay = lunarD.getDay();
  // FIX-LUNAR v4: Use lunar-javascript for exact lunar day matching BadaTime
  let tideNum = ((lunarDay + 6) % 15) + 1;
  // 남해/제주는 일조부등이 다르지만 일단 기본 공식 적용 (7물/8물이 사리)
  if (reg === "제주" || reg === "남해") {
     // 남해/제주는 서해보다 물때가 1물 느린 곳이 많음
     // 하지만 바다타임 기준으로는 전국 공통 공식을 씁니다.
  }`;

if (code.match(oldMathRegex)) {
  code = code.replace(oldMathRegex, newMath);
}

// 3. Override phase in realTide
code = code.replace("phase: realTide.phase,", "phase: tidePhase, // FIX: Ignore cached phase and calculate dynamically");

fs.writeFileSync("src/constants/fishingData.js", code, "utf8");
console.log("Patched fishingData.js!");

