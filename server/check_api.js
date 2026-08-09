const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function checkKmaApi() {
    const KMA_KEY = process.env.KMA_KEY;
    if (!KMA_KEY) {
        console.log("No KMA_KEY found in .env");
        return;
    }

    const buoyNum = '22102'; // 강릉 안목항/동해부이
    const now = new Date(Date.now() + 9 * 3600 * 1000); // KST
    const pad = (n) => String(n).padStart(2, '0');
    const tm2 = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}00`;
    const url = `https://apihub.kma.go.kr/api/typ01/url/sea_obs.php?tm2=${tm2}&stn=${buoyNum}&help=0&authKey=${KMA_KEY}`;
    
    console.log("Request URL:", url.replace(KMA_KEY, "HIDDEN_KEY"));
    
    try {
        const res = await axios.get(url, { timeout: 8000 });
        const text = typeof res.data === 'string' ? res.data : '';
        if (!text || !text.includes('START7777')) {
            console.log("Invalid response format:", text.substring(0, 100));
            return;
        }

        const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#') && l.startsWith('B,'));
        const matched = lines.filter(l => l.includes(buoyNum));
        const targetLine = matched.length ? matched[matched.length - 1] : lines[lines.length - 1];
        
        if (!targetLine) {
            console.log("No matching buoy data found in response");
            return;
        }

        console.log("Raw target line:", targetLine);
        const cols = targetLine.trim().split(',').map(s => s.trim());
        let wh = parseFloat(cols[6]);  // 유효파고
        const wdDeg = parseFloat(cols[7]);  // 풍향(도)
        const ws = parseFloat(cols[8]);  // 풍속
        
        const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
        const wd = isNaN(wdDeg) ? 'N' : dirs[Math.round(wdDeg / 22.5) % 16];
        
        console.log(`\n=== 실시간 관측 데이터 (부이 ${buoyNum}) ===`);
        console.log(`파고: ${wh}m`);
        console.log(`풍향: ${wd} (${wdDeg}도)`);
        console.log(`풍속: ${ws}m/s`);
        
        let reductionFactor = 1.0;
        let windReductionFactor = 0.75;
        // isEastCoast
        if (wd.includes('W')) { reductionFactor = 0.8; windReductionFactor *= 0.5; }
        
        let coastalWh = Math.max(0.1, wh * reductionFactor);
        coastalWh = parseFloat(coastalWh.toFixed(1));
        
        console.log(`\n=== 변환된 연안 파고 ===`);
        console.log(`연안 파고: ${coastalWh}m`);
        console.log(`감쇄 비율: ${reductionFactor}`);
        
    } catch (e) {
        console.error("API 요청 실패:", e.message);
    }
}

checkKmaApi();
