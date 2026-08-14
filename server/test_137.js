const axios = require('axios');
const fs = require('fs');

async function testCache() {
  const indexJs = fs.readFileSync('c:/Users/palin/Desktop/낚시GO/server/index.js', 'utf8');
  console.log("Is 13.7 hardcoded anywhere?", indexJs.includes('13.7'));
}
testCache();
