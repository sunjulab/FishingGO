const jwt = require('jsonwebtoken');
const secret = 'FishingGO_2024_Pr0d_S3cr3t!@#$xK9mQ';
const token = jwt.sign({
  id: 'admin_id',
  email: 'sunjulab.k@gmail.com',
  name: 'Admin',
  role: 'admin',
  tier: 'MASTER'
}, secret, { expiresIn: '1h' });
console.log(token);
