
const fs = require("fs");
let code = fs.readFileSync("server/index.js", "utf8");

// Extract the original /api/tide/obs block
const start = code.indexOf("// \u2500\u2500\u2500 KHOA \uc870\uc11d\uc608\ubcf4 API \ud504\ub85d\uc2dc");
const endStr = "});\n";
const getIdx = code.indexOf("app.get(\u0027/api/tide/obs\u0027", start);
const end = code.indexOf(endStr, getIdx) + endStr.length;

if (start > -1 && end > -1) {
  // Remove the old block
  code = code.substring(0, start) + code.substring(end);
  
  // Create new block
  const newBlock = `// ─── KHOA 조석예보 API 프록시 ──────────────────────────────────────────────
const _tideCache = new Map(); // { key: { data, ts } }
const TIDE_CACHE_TTL = 60 * 60 * 1000; // 1시간

/**
 * GET /api/tide/obs?obsCode=DT_0011&date=20260909
 * KHOA 조석예보 API 프록시 ? 만조/간조 시간 정확도 개선
 */
app.get("/api/tide/obs", async (req, res) => {
  const obsCode = (req.query.obsCode || "").trim();
  const date    = (req.query.date || "").trim() ||
    new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/\\./g, "").replace(/ /g, "").padStart(8, "0");

  if (!obsCode) return res.status(400).json({ error: "obsCode 필수" });

  let tideSid = obsCode;
  if (tideSid.startsWith("DT_")) {
    const coords = STATION_COORDS[tideSid] || OBS_COORDS[tideSid];
    if (coords) tideSid = getNearestKhoaStation(coords.lat, coords.lng);
  }

  const cacheKey = tideSid + "_" + date;
  const cached = _tideCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TIDE_CACHE_TTL) {
    return res.json(cached.data);
  }

  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) {
    return res.status(503).json({ error: "KHOA_KEY 미설정", fallback: true });
  }

  try {
    const url = "https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService?serviceKey=" + encodeURIComponent(KEY) + "&obsCode=" + tideSid + "&reqDate=" + date + "&type=json&numOfRows=20&pageNo=1";
    const resp = await axios.get(url, { timeout: 8000 });
    
    const items = resp.data?.body?.items?.item || resp.data?.response?.body?.items?.item || [];
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0 || !list[0]) {
       return res.status(502).json({ error: "KHOA 데이터 없음", fallback: true });
    }

    const highs = list.filter(t => t.extrSe === "1" || t.extrSe === "3" || t.hl_code === "H").map(t => (t.predcDt || t.hl_time || "").slice(11, 16)).filter(Boolean);
    const lows = list.filter(t => t.extrSe === "2" || t.extrSe === "4" || t.hl_code === "L").map(t => (t.predcDt || t.hl_time || "").slice(11, 16)).filter(Boolean);

    const result = { obsCode, date, tideSid, high: highs[0] || null, high2: highs[1] || null, low: lows[0] || null, low2: lows[1] || null, source: "khoa", rawData: list.map(t => ({ hl_code: t.extrSe === "1" || t.extrSe === "3" ? "H" : "L", tph_time: t.predcDt || t.hl_time, tph_level: t.predcTdlvVl || t.hl_level })) };
    _tideCache.set(cacheKey, { data: result, ts: Date.now() });
    res.json(result);
  } catch (err) {
    logger.warn("[KHOA Tide] " + obsCode + " " + date + " 오류: " + err.message);
    res.status(502).json({ error: "KHOA API 오류", fallback: true });
  }
});
`;
  
  // Insert it before the 404 handler
  const catchAll = code.indexOf("FIX-404-HANDLER");
  if (catchAll > -1) {
    const insertIdx = code.lastIndexOf("\n", catchAll) + 1;
    code = code.substring(0, insertIdx) + newBlock + "\n" + code.substring(insertIdx);
    fs.writeFileSync("server/index.js", code, "utf8");
    console.log("Patched /api/tide/obs and moved it!");
  } else {
    console.log("404 handler not found.");
  }
} else {
  console.log("Old block not found.");
}

