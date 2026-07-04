const axios = require('axios');
axios.get('https://www.nifs.go.kr/OpenAPI_json?id=risaList').then(res => {
  const items = res.data?.body?.items?.item || [];
  const map = {};
  items.forEach(i => {
    map[i.sta_cde] = i.sta_nam_kor;
  });
  console.log(map);
});
