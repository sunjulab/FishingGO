const fs = require('fs');
const http = require('http');

async function checkAll() {
  try {
    const cp = require('./customPoints.json');
    const stations = Object.values(cp);
    
    console.log(`Total Custom Points: ${stations.length}`);
    
    // Group by region to get an overview
    const regions = {};
    
    // We'll sample up to 5 points per region to get a good nationwide estimate without spamming the server
    for (const st of stations) {
      if (!regions[st.region]) regions[st.region] = [];
      if (regions[st.region].length < 10) {
         regions[st.region].push(st);
      }
    }

    const results = {};

    for (const region of Object.keys(regions)) {
      results[region] = { wave: [], wind: [], sst: [], isFallback: false };
      for (const st of regions[region]) {
        const res = await fetch(`http://localhost:5000/api/nearest-station?lat=${st.lat}&lng=${st.lng}`);
        const data = await res.json();
        
        const w = data.weather;
        if (w) {
            results[region].wave.push(parseFloat(w.wave?.coastal || 0));
            results[region].wind.push(parseFloat(w.wind?.speed || 0));
            results[region].sst.push(parseFloat(w.sst || 0));
            if (w._sources?.wind === 'fallback' || w._sources?.sst === 'fallback') {
                results[region].isFallback = true;
            }
        }
      }
    }
    
    for (const region of Object.keys(results)) {
       const waveAvg = (results[region].wave.reduce((a,b)=>a+b,0) / results[region].wave.length).toFixed(1);
       const windAvg = (results[region].wind.reduce((a,b)=>a+b,0) / results[region].wind.length).toFixed(1);
       const sstAvg = (results[region].sst.reduce((a,b)=>a+b,0) / results[region].sst.length).toFixed(1);
       
       console.log(`[${region}] Wave: ${waveAvg}m | Wind: ${windAvg}m/s | SST: ${sstAvg}C | Fallback: ${results[region].isFallback}`);
    }

  } catch (e) {
    console.error(e);
  }
}

checkAll();
