const axios = require('axios'); require('dotenv').config(); 
async function test() { 
  const key = process.env.KMA_KEY; 
  const now = new Date(Date.now() + 9 * 3600 * 1000); 
  const pad = n => String(n).padStart(2, '0'); 
  const tm = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}00`; 
  const url = `https://apihub.kma.go.kr/api/typ01/url/sea_obs.php?tm=${tm}&stn=22105&help=1&authKey=${key}`; 
  try { 
    const res = await axios.get(url); 
    console.log(res.data.substring(0, 500)); 
  } catch(e) { 
    console.error(e.response ? e.response.status + " " + e.response.data : e.message); 
  } 
} 
test();
