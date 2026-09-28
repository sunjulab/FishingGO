const express = require('express');
const axios = require('axios');

function createTideRouter({ STATION_COORDS, OBS_COORDS, getNearestKhoaStation, logger }) {
  const router = express.Router();
const _tideCache = new Map(); // { key: { data, ts } }
const TIDE_CACHE_TTL = 60 * 60 * 1000; // 1�ð�

/**
 * GET /api/tide/obs?obsCode=DT_0011&date=20260909
 * KHOA �������� API ���Ͻ� ? ����/���� �ð� ��Ȯ�� ����
 */
router.get("/obs", async (req, res) => {
  const obsCode = (req.query.obsCode || "").trim();
  const date    = (req.query.date || "").trim() ||
    new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/\./g, "").replace(/ /g, "").padStart(8, "0");

  if (!obsCode) return res.status(400).json({ error: "obsCode �ʼ�" });

  let tideSid = obsCode;

  const cacheKey = tideSid + "_" + date;
  const cached = _tideCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TIDE_CACHE_TTL) {
    return res.json(cached.data);
  }

  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) {
    return res.status(503).json({ error: "KHOA_KEY �̼���", fallback: true });
  }

  try {
    const url = "https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService?serviceKey=" + encodeURIComponent(KEY) + "&obsCode=" + tideSid + "&reqDate=" + date + "&type=json&numOfRows=20&pageNo=1";
    const resp = await axios.get(url, { timeout: 8000 });
    
    const items = resp.data?.body?.items?.item || resp.data?.response?.body?.items?.item || [];
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0 || !list[0]) {
       return res.status(502).json({ error: "KHOA ������ ����", fallback: true });
    }

    const highs = list.filter(t => t.extrSe === "1" || t.extrSe === "3" || t.hl_code === "H").map(t => (t.predcDt || t.hl_time || "").slice(11, 16)).filter(Boolean);
    const lows = list.filter(t => t.extrSe === "2" || t.extrSe === "4" || t.hl_code === "L").map(t => (t.predcDt || t.hl_time || "").slice(11, 16)).filter(Boolean);

    const result = { obsCode, date, tideSid, high: highs[0] || null, high2: highs[1] || null, low: lows[0] || null, low2: lows[1] || null, source: "khoa", rawData: list.map(t => ({ hl_code: t.extrSe === "1" || t.extrSe === "3" ? "H" : "L", tph_time: t.predcDt || t.hl_time, tph_level: t.predcTdlvVl || t.hl_level })) };
    _tideCache.set(cacheKey, { data: result, ts: Date.now() });
    res.json(result);
  } catch (err) {
    logger.warn("[KHOA Tide] " + obsCode + " " + date + " ����: " + err.message);
    res.status(502).json({ error: "KHOA API ����", fallback: true });
  }
});
  return router;
}

module.exports = createTideRouter;
