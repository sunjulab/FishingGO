const fs = require('fs');
let code = fs.readFileSync('src/components/FishingPointBottomSheet.jsx', 'utf8');

// Fix 1:
code = code.replace(/const sid = selectedPoint\.obsCode \|\| '';/g, "const sid = selectedPoint.obsCode || (marineData?.stationId) || '';");

// Fix 2:
code = code.replace(/\{selectedPoint\?\.type === '민물' \|\| !selectedPoint\?\.obsCode \? \(/g, 
  "{selectedPoint?.type === '민물' || (!selectedPoint?.obsCode && !marineData?.stationId) ? (");

fs.writeFileSync('src/components/FishingPointBottomSheet.jsx', code, 'utf8');
console.log('Fixed FishingPointBottomSheet.jsx');
