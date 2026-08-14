const axios = require('axios');
const NIFS_STA_MAP = {
  'DT_0009': 'egsi4',  // 군산      → 군산 신시도
  'DT_0008': 'fbsp5',  // 보령      → 보령 소도
};
async function test() {
  const NIFS_KEY = process.env.NIFS_KEY || 'qPwOeIrU-2606-NCSXWE-1656';
  const url = `https://www.nifs.go.kr/OpenAPI_json?id=risaList&key=${NIFS_KEY}`;
  const res = await axios.get(url);
  const items = res.data?.body?.item.filter(i => String(i.rpr_yn) === 'N');
  
  const map = {};
  for (const item of items) {
    const key = item.sta_cde;
    if (!map[key]) {
      map[key] = { obs_dat: item.obs_dat, obs_tim: item.obs_tim, name: item.sta_nam_kor, upper: null, middle: null, lower: null };
    }
    const currentDateTime = parseInt((map[key].obs_dat + map[key].obs_tim).replace(/\D/g, ''), 10);
    const itemDateTime = parseInt((item.obs_dat + item.obs_tim).replace(/\D/g, ''), 10);
    
    if (itemDateTime > currentDateTime) {
      map[key] = { obs_dat: item.obs_dat, obs_tim: item.obs_tim, name: item.sta_nam_kor, upper: null, middle: null, lower: null };
    }
    
    if (itemDateTime >= currentDateTime) {
      map[key].name = item.sta_nam_kor;
      const lay = String(item.obs_lay);
      const tmp = item.wtr_tmp;
      const isValidTmp = tmp && tmp !== '-' && !isNaN(parseFloat(tmp));
      const val = isValidTmp ? String(parseFloat(tmp).toFixed(1)) : null;
      if (lay === '1' && val) map[key].upper = val;
    }
  }

  console.log("DT_0009 mapped to:", map[NIFS_STA_MAP['DT_0009']]);
  console.log("DT_0008 mapped to:", map[NIFS_STA_MAP['DT_0008']]);
}
test();
