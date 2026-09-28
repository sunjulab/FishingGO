const axios = require('axios');
const KHOA_KEY = 'fJGmul9XoFvrHmwyVM/8eQ==';
axios.get('https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService?serviceKey=' + encodeURIComponent(KHOA_KEY) + '&obsCode=DT_0001&reqDate=20260928&type=json&numOfRows=20&pageNo=1')
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(console.error);
