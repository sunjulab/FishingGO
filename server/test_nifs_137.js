const axios = require('axios');

async function testNifs() {
  const NIFS_KEY = process.env.NIFS_KEY || 'qPwOeIrU-2606-NCSXWE-1656';
  const url = `https://www.nifs.go.kr/OpenAPI_json?id=risaList&key=${NIFS_KEY}`;
  try {
    const res = await axios.get(url);
    const items = res.data?.body?.item;
    const egsi4 = items.filter(i => i.sta_cde === 'egsi4' && i.rpr_yn === 'N');
    const fbsp5 = items.filter(i => i.sta_cde === 'fbsp5' && i.rpr_yn === 'N');
    console.log('egsi4 (군산):', egsi4);
    console.log('fbsp5 (보령):', fbsp5);
  } catch (e) {
    console.error(e);
  }
}
testNifs();
