
const axios = require("axios");
const fs = require("fs");
const code = fs.readFileSync("server/index.js", "utf8");
const match = code.match(/const STATION_BASE_HIGH = (\{[\s\S]*?\});/);
if (match) {
  const stationBase = eval("(" + match[1] + ")");
  const points = Object.keys(stationBase);
  console.log("Found", points.length, "points to check.");
  
  async function checkAll() {
    let successCount = 0;
    let fallbackCount = 0;
    let errorCount = 0;
    for (const sid of points) {
      try {
        const res = await axios.get("https://fishing-go-backend.onrender.com/api/tide/obs?obsCode=" + sid + "&date=20260927", { timeout: 10000 });
        if (res.data && res.data.source === "khoa") {
          successCount++;
          console.log(`[OK] ${sid} -> KHOA(${res.data.tideSid}): H=${res.data.high} L=${res.data.low}`);
        } else {
          fallbackCount++;
          console.log(`[WARN] ${sid}: Fallback data?`);
        }
      } catch (err) {
        errorCount++;
        console.log(`[ERR] ${sid}: Error ${err.response ? err.response.status : err.message}`);
      }
    }
    console.log(`\nTotal: ${points.length} | Success: ${successCount} | Fallback: ${fallbackCount} | Error: ${errorCount}`);
  }
  checkAll();
} else {
  console.log("Could not find STATION_BASE_HIGH");
}

