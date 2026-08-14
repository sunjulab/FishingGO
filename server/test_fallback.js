const MONTHLY_BASE_TEMP = {
  '동해': [8.5,8.0,9.5,12.5,16.0,19.5,22.0,24.0,21.5,18.0,14.0,10.0],
  '남해': [10.0,10.0,12.0,15.0,18.5,21.5,24.5,26.0,24.0,20.0,15.5,11.5],
  '서해': [5.0,5.0,7.5,11.5,16.5,20.5,23.5,25.0,22.5,17.5,12.0,7.0],
  '제주': [15.5,15.0,16.5,18.5,21.5,24.5,27.0,28.5,26.5,23.5,19.5,16.5],
};

const observationData = {
  'DT_0008': { name: '보령 대천항', region: '서해', baseTemp: 12.8 },
  'DT_0009': { name: '군산 비응항', region: '서해', baseTemp: 13.2 },
  'DT_0030': { name: '태안 안흥항', region: '서해', baseTemp: 12.5 },
};

function test(sid) {
  const base = observationData[sid];
  const seed = parseInt(sid.replace(/\D/g, '')) || 1;
  const lcg = (n) => ((seed * 9301 + 49297 * n) % 233280) / 233280;

  // Let's assume MONTHLY_BASE_TEMP is bugged or undefined
  let monthlyBase = MONTHLY_BASE_TEMP[base.region]?.[12]; // intentionally out of bounds
  monthlyBase = monthlyBase ?? base.baseTemp;

  const finalTemp = (monthlyBase + (lcg(1) * 0.8 - 0.4)).toFixed(1);
  console.log(`${sid}: baseTemp=${base.baseTemp} -> finalTemp=${finalTemp}`);
}

['DT_0008', 'DT_0009', 'DT_0030'].forEach(test);
