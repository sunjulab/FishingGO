const axios = require('axios');

async function testKhoa() {
  const KHOA_KEY = process.env.KHOA_KEY || 'U1BqM8tN/Z312cEDf78mQ==';
  for (const sid of ['DT_0008', 'DT_0009']) {
    const today = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 8);
    const url = `http://www.khoa.go.kr/oceangrid/grid/api/obsWaveHight/search.do?ServiceKey=${encodeURIComponent(KHOA_KEY)}&ObsCode=${sid}&Date=${today}&ResultType=json`;
    try {
      const res = await axios.get(url, { timeout: 5000 });
      const items = res.data?.result?.data;
      if (items && items.length > 0) {
        const last = items[items.length - 1];
        console.log(`KHOA ${sid}:`, last.water_temp || last.waterTemp || 'N/A');
      } else {
        console.log(`KHOA ${sid}: No data`);
      }
    } catch (e) {
      console.log(`KHOA ${sid}: ERROR`, e.message);
    }
  }
}
testKhoa();
