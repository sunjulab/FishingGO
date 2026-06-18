import fs from 'fs';
import https from 'https';

const url = "https://fishing-go-backend.onrender.com/api/weather/cctv/proxy?url=https%3A%2F%2Fcoast.mof.go.kr%2FserviceGateway.jsp%3Fhttp%3A%2F%2F10.176.62.134%3A9001%2FtilemapApi.do%3Furl%3Dhttp%3A%2F%2F220.95.232.18%3A8080%2Fimg%2F53_0.jpg%3Ft%3D123123";

https.get(url, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  const file = fs.createWriteStream('cctv_test.jpg');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download complete.');
    console.log('File size:', fs.statSync('cctv_test.jpg').size);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
