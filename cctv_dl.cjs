const fs=require('fs'), axios=require('axios'); axios.get('https://d.kbs.co.kr/static/js/special/cctv.js').then(res => fs.writeFileSync('cctv.js', res.data));
