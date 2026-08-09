const axios = require('axios');
const xml2js = require('xml2js');
require('dotenv').config();

async function checkGangneung() {
    const KMA_KEY = process.env.KMA_KEY;
    if (!KMA_KEY) {
        console.log("No KMA_KEY");
        return;
    }
    
    // 강릉 안목항 (DT_0001) -> 동해부이 (22102)
    const buoyNum = '22102';
    const now = new Date();
    // KST 기준으로 변경
    now.setHours(now.getHours() + 9);
    
    // 최근 2시간 전부터 검색 (데이터 지연 고려)
    now.setHours(now.getHours() - 2);
    
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    let hh = now.getHours().toString().padStart(2, '0');
    let tmFc = `${yyyymmdd}${hh}00`;

    const url = `http://apis.data.go.kr/1360000/OceanInfoService/getOceansIhtdyInfo?serviceKey=${encodeURIComponent(KMA_KEY)}&pageNo=1&numOfRows=10&dataType=JSON&obs_post_id=${buoyNum}`;
    
    console.log("URL:", url);
    try {
        const res = await axios.get(url, { timeout: 10000 });
        if (res.data && res.data.response && res.data.response.body) {
            const items = res.data.response.body.items.item;
            if (items && items.length > 0) {
                const latest = items[items.length - 1] || items[0];
                console.log("최신 부이 데이터:", latest);
                
                let wh = parseFloat(latest.wh_max || latest.wh_sig || 0);
                let ws = parseFloat(latest.ws || 0);
                let wdDeg = parseFloat(latest.wd || 0);
                
                const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
                const wd = isNaN(wdDeg) ? 'N' : dirs[Math.round(wdDeg / 22.5) % 16];
                
                console.log(`원시 데이터 -> 파고: ${wh}m, 풍속: ${ws}m/s, 풍향: ${wd} (${wdDeg}도)`);
                
                // 우리 로직 시뮬레이션
                let reductionFactor = 1.0;
                if (wd.includes('W')) { reductionFactor = 0.3; } // 육풍
                
                let coastalWh = Math.max(0.1, wh * reductionFactor);
                console.log(`변환된 연안 파고 -> ${coastalWh.toFixed(1)}m`);
            } else {
                console.log("데이터 항목이 없습니다.");
            }
        } else {
            console.log("API 응답 실패:", res.data);
        }
    } catch (e) {
        console.error("오류:", e.message);
    }
}

checkGangneung();
