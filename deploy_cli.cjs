const os = require('os');
const originalUserInfo = os.userInfo;
os.userInfo = function(options) {
  const info = originalUserInfo(options);
  if (info && info.username) {
    info.username = "FisherGO_Dev"; // Force ASCII username to fix Vercel Windows HTTP Header crash
  }
  return info;
};

// Execute global Vercel CLI
require('C:\\Users\\palin\\AppData\\Roaming\\npm\\node_modules\\vercel\\dist\\vc.js');
