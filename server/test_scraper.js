const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('https://www.weather.go.kr/w/weather/warning.do');
    const html = res.data;
    const match = html.match(/<div class="cmp-view-content">([\s\S]*?)<\/div>/);
    const content = match ? match[1].replace(/<[^>]*>?/gm, '').trim() : "NOT FOUND";
    console.log(content.substring(0, 1000));
  } catch(e) {
    console.error(e);
  }
}
run();
