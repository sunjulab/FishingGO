const axios = require('axios');
const KHOA_KEY = 'fJGmul9XoFvrHmwyVM/8eQ==';
axios.get('https://www.khoa.go.kr/api/oceangrid/tideObsPreTab/search.do?ServiceKey=' + encodeURIComponent(KHOA_KEY) + '&ObsCode=DT_0001&Date=20260928&ResultType=json')
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(console.error);
