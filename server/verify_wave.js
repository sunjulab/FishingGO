const assert = require('assert');

function calculateCoastalWave(sid, wh, wd) {
    let reductionFactor = 1.0;
    let windReductionFactor = 0.75;

    const isEastCoast = ['DT_0001','DT_0002','DT_0003','DT_0021','DT_0033','DT_0036','DT_0099'].includes(sid);
    const isWestCoast = ['DT_0007','DT_0008','DT_0009','DT_0030'].includes(sid);
    const isSouthCoast = !isEastCoast && !isWestCoast;

    if (isEastCoast) {
      if (wd.includes('W')) { reductionFactor = 0.3; windReductionFactor *= 0.5; }
    } else if (isWestCoast) {
      if (wd.includes('E')) { reductionFactor = 0.3; windReductionFactor *= 0.5; }
    } else if (isSouthCoast) {
      if (wd.includes('N')) { reductionFactor = 0.3; windReductionFactor *= 0.5; }
    }

    let coastalWh = Math.max(0.1, wh * reductionFactor);
    coastalWh = parseFloat(coastalWh.toFixed(1));

    return coastalWh;
}

const testCases = [
    // East Coast (DT_0001)
    { sid: 'DT_0001', coast: 'East', wd: 'E', wh: 2.0, expected: 2.0 }, // Sea breeze
    { sid: 'DT_0001', coast: 'East', wd: 'W', wh: 2.0, expected: 0.6 }, // Land breeze
    { sid: 'DT_0001', coast: 'East', wd: 'NW', wh: 2.0, expected: 0.6 }, // Land breeze
    { sid: 'DT_0001', coast: 'East', wd: 'S', wh: 2.0, expected: 2.0 }, // Parallel

    // West Coast (DT_0007)
    { sid: 'DT_0007', coast: 'West', wd: 'W', wh: 2.0, expected: 2.0 }, // Sea breeze
    { sid: 'DT_0007', coast: 'West', wd: 'E', wh: 2.0, expected: 0.6 }, // Land breeze
    { sid: 'DT_0007', coast: 'West', wd: 'SE', wh: 2.0, expected: 0.6 }, // Land breeze
    { sid: 'DT_0007', coast: 'West', wd: 'S', wh: 2.0, expected: 2.0 }, // Parallel

    // South Coast (DT_0004)
    { sid: 'DT_0004', coast: 'South', wd: 'S', wh: 2.0, expected: 2.0 }, // Sea breeze
    { sid: 'DT_0004', coast: 'South', wd: 'N', wh: 2.0, expected: 0.6 }, // Land breeze
    { sid: 'DT_0004', coast: 'South', wd: 'NNE', wh: 2.0, expected: 0.6 }, // Land breeze
    { sid: 'DT_0004', coast: 'South', wd: 'E', wh: 2.0, expected: 2.0 }, // Parallel
];

console.log("=== 파도 감쇄 로직 전수조사 ===");
let passed = 0;
testCases.forEach((t, i) => {
    const result = calculateCoastalWave(t.sid, t.wh, t.wd);
    const success = result === t.expected;
    if (success) passed++;
    console.log(`[${t.coast} ${t.sid}] 풍향: ${t.wd.padEnd(3)} | 원본 파고: ${t.wh.toFixed(1)}m => 연안 파고: ${result.toFixed(1)}m (예상: ${t.expected.toFixed(1)}m) - ${success ? '✅ PASS' : '❌ FAIL'}`);
});

console.log(`\n결과: ${passed}/${testCases.length} 테스트 통과`);
