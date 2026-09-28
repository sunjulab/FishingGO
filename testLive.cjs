const axios = require('axios');
axios.get('https://fishing-go-backend.onrender.com/api/tide/obs?obsCode=DT_0001&date=20260929')
  .then(res => console.log('Live Backend Response:', JSON.stringify(res.data, null, 2)))
  .catch(err => console.error('Error:', err.message));
