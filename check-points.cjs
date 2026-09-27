const axios = require('axios');

const ALL_STATIONS = [
  'DT_0099', 'DT_0001', 'DT_0021', 'DT_0033', 'DT_0003', 'DT_0002', 'DT_0036',
  'DT_0004', 'DT_0005', 'DT_0016', 'DT_0034', 'DT_0018',
  'DT_0007', 'DT_0008', 'DT_0009', 'DT_0030',
  'DT_0011', 'DT_0010', 'DT_0045', 'DT_0006', 'DT_0014'
];

async function check() {
  console.log('--- 전 포인트 날씨 데이터 점검 ---');
  let successCount = 0;
  for (const sid of ALL_STATIONS) {
    try {
      const r = await axios.get('https://www.fishing-go.com/api/weather/precision?stationId=' + sid, { timeout: 10000 });
      const d = r.data;
      console.log([]  | 풍속: m/s () | 파고: m | 풍속출처: );
      if (d._sources?.wind.includes('KMA_ULTRASRT_PRECISION') || d._sources?.wind.includes('KMA_BUOY')) {
         successCount++;
      }
    } catch (e) {
      console.log([] 에러: );
    }
  }
  console.log(\n정상 반영 포인트:  / );
}
check();
