const axios = require('axios');

async function runTests() {
  console.log('Starting 5 tests for Samcheok (DT_0003) and Gangneung (DT_0001)...');
  
  for(let i=1; i<=5; i++) {
    try {
      const res1 = await axios.get('http://localhost:5000/api/weather/precision?stationId=DT_0003');
      const res2 = await axios.get('http://localhost:5000/api/weather/precision?stationId=DT_0001');
      
      const s = res1.data.layers || {};
      const g = res2.data.layers || {};
      
      console.log(`Test ${i} - Samcheok : Upper=${s.upper}, Middle=${s.middle}, Lower=${s.lower}`);
      console.log(`Test ${i} - Gangneung: Upper=${g.upper}, Middle=${g.middle}, Lower=${g.lower}`);
      
      if (s.middle && parseFloat(s.upper) < parseFloat(s.middle)) {
         console.error('ERROR: Inversion detected in Samcheok!');
      }
      if (g.middle && parseFloat(g.upper) < parseFloat(g.middle)) {
         console.error('ERROR: Inversion detected in Gangneung!');
      }
    } catch(e) {
      console.log(`Test ${i} failed: ${e.message}`);
    }
  }
}

runTests();
