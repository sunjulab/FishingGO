const fs = require('fs');

async function check() {
  try {
    const cp = require('./customPoints.json');
    const southStations = cp.filter(p => p.region === '남해' || p.region === '경남' || p.region === '부산');
    
    console.log(`Found ${southStations.length} south stations`);
    
    // In order to get the weather for each, we can call nearest-station
    for (const st of southStations.slice(0, 10)) {
      const res = await fetch(`http://localhost:5000/api/nearest-station?lat=${st.lat}&lng=${st.lng}`);
      const data = await res.json();
      console.log(`Point: ${st.name} (Lat: ${st.lat}, Lng: ${st.lng})`);
      console.log(`Nearest Station: ${data.stationId} (${data.name})`);
      console.log(`Weather Data:`, data.weather);
      console.log('------------------');
    }
  } catch (e) {
    console.error(e);
  }
}
check();
