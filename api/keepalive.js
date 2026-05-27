// Vercel Serverless Function — Render 백엔드 keepalive
// vercel.json cron에서 5분마다 호출 → Render 슬립 방지
export default async function handler(req, res) {
  try {
    const r = await fetch('https://fishing-go-backend.onrender.com/api/health', {
      signal: AbortSignal.timeout(20000),
    });
    const data = await r.json();
    res.status(200).json({ ok: true, uptime: data.uptime, db: data.db });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
}
