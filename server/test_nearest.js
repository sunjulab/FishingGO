function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STATION_COORDS = {
  'DT_0008': { lat: 36.3523, lng: 126.5078 },
  'DT_0009': { lat: 35.9697, lng: 126.5621 },
  'DT_0030': { lat: 36.6666, lng: 126.1362 }, // guessed
  'DT_0014': { lat: 34.9083, lng: 127.7616 },
  'DT_0006': { lat: 34.7797, lng: 126.3756 },
  'DT_0016': { lat: 34.8277, lng: 128.4312 },
  'DT_0034': { lat: 34.8430, lng: 128.7185 },
}; // I need to get full STATION_COORDS from index.js

const fs = require('fs');
const indexJs = fs.readFileSync('c:/Users/palin/Desktop/낚시GO/server/index.js', 'utf8');
const coordsMatch = indexJs.match(/const STATION_COORDS = \{([\s\S]*?)\};/);
if (coordsMatch) {
  eval(`var FULL_COORDS = {${coordsMatch[1]}};`);
  function findNearest(lat, lng) {
    let nearest = null, minDist = Infinity;
    for (const [sid, coords] of Object.entries(FULL_COORDS)) {
      const d = haversineKm(lat, lng, coords.lat, coords.lng);
      if (d < minDist) { minDist = d; nearest = sid; }
    }
    return { sid: nearest, dist: minDist };
  }

  console.log('Seocheon:', findNearest(36.124137, 126.594745));
  console.log('Seonyudo:', findNearest(35.807174, 126.40791));
  console.log('Buan:', findNearest(35.581064, 126.506711));
}
