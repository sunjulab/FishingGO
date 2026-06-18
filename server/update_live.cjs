const axios = require('axios');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluX2lkIiwiZW1haWwiOiJzdW5qdWxhYi5rQGdtYWlsLmNvbSIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJhZG1pbiIsInRpZXIiOiJNQVNURVIiLCJpYXQiOjE3ODE4MDQwMzQsImV4cCI6MTc4MTgwNzYzNH0.xsQ0CAV6QMQ3qpoEoh3IVd7qIOYbKypJ7xgXaRdmr9U';

async function updatePoint() {
  try {
    const res = await axios.put('https://fishing-go-backend.onrender.com/api/admin/cctv/point_102', {
      type: 'mof_custom',
      youtubeId: 'https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=http://220.95.232.18:8080/img/53_0.jpg'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Update point_42:', res.data);
    
    // Check if there is another point (maybe DT_0003 or Yangyang 하조대?)
    // "양양 하조대항" was previously checked. Let's just let the user know they need to hard refresh.
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
updatePoint();
