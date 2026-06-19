const fs = require('fs');
const jwt = require('jsonwebtoken');
const https = require('https');

const JWT_SECRET = 'FishingGO_2024_Pr0d_S3cr3t!@#$xK9mQ';
const token = jwt.sign(
  { email: 'sunjulab.k@gmail.com', tier: 'MASTER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const data = fs.readFileSync('../src/constants/freshwaterData.js', 'utf8');
const points = [];
const regex = /{([^}]+)}/g;
let match;
while ((match = regex.exec(data)) !== null) {
  if (match[1].includes("'민물'")) {
    const idMatch = match[1].match(/id:\s*(\d+)/);
    const nameMatch = match[1].match(/name:\s*'([^']+)'/);
    if (idMatch) {
      points.push({
        id: 'point_' + idMatch[1],
        name: nameMatch ? nameMatch[1] : '민물 포인트'
      });
    }
  }
}

console.log(`Found ${points.length} freshwater points. Updating...`);

let successCount = 0;
let failCount = 0;

function updatePoint(index) {
  if (index >= points.length) {
    console.log(`Finished! Success: ${successCount}, Fail: ${failCount}`);
    return;
  }

  const point = points[index];
  const payload = JSON.stringify({
    youtubeId: 'ㅇㅇ',
    type: 'iframe',
    label: point.name + ' (준비중)'
  });

  const options = {
    hostname: 'fishing-go-backend.onrender.com',
    path: '/api/admin/cctv/' + point.id,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', () => {});
    res.on('end', () => {
      if (res.statusCode === 200) {
        successCount++;
        console.log(`[${index + 1}/${points.length}] Success: ${point.id} (${point.name})`);
      } else {
        failCount++;
        console.error(`[${index + 1}/${points.length}] Failed: ${point.id} - Status ${res.statusCode}`);
      }
      setTimeout(() => updatePoint(index + 1), 50); // slight delay to avoid rate limits
    });
  });

  req.on('error', (e) => {
    failCount++;
    console.error(`[${index + 1}/${points.length}] Error: ${point.id} - ${e.message}`);
    setTimeout(() => updatePoint(index + 1), 50);
  });

  req.write(payload);
  req.end();
}

updatePoint(0);
