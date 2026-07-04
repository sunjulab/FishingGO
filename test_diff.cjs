const fs = require('fs'); 
const frontendCode = fs.readFileSync('c:/Users/palin/Desktop/낚시GO/src/utils/weather.js', 'utf8'); 
const frontendStations = {}; 
const feMatch = frontendCode.match(/const OBSERVATION_STATIONS = \[([\s\S]*?)\];/)[1]; 
feMatch.split('\n').forEach(line => { 
  const m = line.match(/id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)/); 
  if (m) frontendStations[m[1]] = { name: m[2], lat: parseFloat(m[3]), lng: parseFloat(m[4]) }; 
}); 

const backendCode = fs.readFileSync('c:/Users/palin/Desktop/낚시GO/server/index.js', 'utf8'); 
const beMatch = backendCode.match(/const STATION_COORDS = \{([\s\S]*?)\};\n\n\/\*/); 
const backendStations = {}; 
beMatch[1].split('\n').forEach(line => { 
  const m = line.match(/'([^']+)':\s*\{\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)/); 
  if (m) backendStations[m[1]] = { lat: parseFloat(m[2]), lng: parseFloat(m[3]) }; 
}); 

console.log('ID\tFE Name\t\tLat Diff\tLng Diff'); 
Object.keys(frontendStations).forEach(id => { 
  const fe = frontendStations[id]; 
  const be = backendStations[id]; 
  if (be) { 
    console.log(id + '\t' + fe.name.padEnd(20, ' ') + '\t' + Math.abs(fe.lat - be.lat).toFixed(4) + '\t' + Math.abs(fe.lng - be.lng).toFixed(4)); 
  } 
});
