const https = require('https');
https.get('https://www.nifs.go.kr/risa/main.risa', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /<option[^>]*value="([a-zA-Z0-9]+)"[^>]*>([^<]+)<\/option>/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      const code = match[1];
      const name = match[2];
      if (['강릉', '속초', '고성', '양양', '삼척', '동해', '울진', '묵호', '영금정', '죽변', '후포'].some(k => name.includes(k))) {
        console.log(`${code}: ${name.trim()}`);
      }
    }
  });
});
