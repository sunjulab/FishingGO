
const fs = require("fs");
let code = fs.readFileSync("server/index.js", "utf8");

const start = code.indexOf("async function getRealTide(sid) {");
const end = code.indexOf("});\n}", start) + 5;
if (start > -1 && end > -1) {
  const replacement = "async function getRealTide(sid) {\n" +
  "  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;\n" +
  "  if (!KEY) return null;\n" +
  "  \n" +
  "  const coords = STATION_COORDS[sid] || OBS_COORDS[sid];\n" +
  "  let tideSid = sid;\n" +
  "  if (coords) {\n" +
  "    tideSid = getNearestKhoaStation(coords.lat, coords.lng);\n" +
  "  }\n" +
  "\n" +
  "  return getDeduplicatedPromise(\"tide_\" + tideSid, async () => {\n" +
  "    try {\n" +
  "      const kst = new Date(Date.now() + 9 * 3600 * 1000);\n" +
  "      const today = \"\" + kst.getUTCFullYear() + String(kst.getUTCMonth()+1).padStart(2,\"0\") + String(kst.getUTCDate()).padStart(2,\"0\");\n" +
  "      const url = \"https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService?serviceKey=\" + encodeURIComponent(KEY) + \"&obsCode=\" + tideSid + \"&reqDate=\" + today + \"&type=json&numOfRows=20&pageNo=1\";\n" +
  "      const res = await axios.get(url, { timeout: 6000, headers: { Accept: \"application/json\" } });\n" +
  "      const items = res.data?.body?.items?.item || res.data?.response?.body?.items?.item;\n" +
  "      if (!items) return null;\n" +
  "      const list = Array.isArray(items) ? items : [items];\n" +
  "      \n" +
  "      const highs = list.filter(t => t.extrSe === \"1\" || t.extrSe === \"3\" || t.hl_code === \"H\");\n" +
  "      const lows  = list.filter(t => t.extrSe === \"2\" || t.extrSe === \"4\" || t.hl_code === \"L\");\n" +
  "      \n" +
  "      const highTime = (highs[0]?.predcDt || highs[0]?.hl_time || \"\").slice(11,16) || null;\n" +
  "      const lowTime  = (lows[0]?.predcDt  || lows[0]?.hl_time  || \"\").slice(11,16) || null;\n" +
  "      const nextLow  = (lows[1]?.predcDt  || lows[1]?.hl_time  || \"\").slice(11,16) || null;\n" +
  "      const lunarDay = getLunarDay();\n" +
  "      const station = observationData[sid] || { region: \"Àü±¹\" };\n" +
  "      const phase = getTidePhase(lunarDay, station.region);\n" +
  "      return { phase, high: highTime, low: lowTime, next_low: nextLow };\n" +
  "    } catch (e) {\n" +
  "      return null;\n" +
  "    }\n" +
  "  });\n" +
  "}";
  code = code.substring(0, start) + replacement + code.substring(end);
  fs.writeFileSync("server/index.js", code, "utf8");
  console.log("getRealTide fixed!");
} else {
  console.log("Could not find boundaries");
}

