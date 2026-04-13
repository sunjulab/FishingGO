import os from 'os';
const originalUserInfo = os.userInfo;
os.userInfo = function(options) {
  const info = originalUserInfo(options);
  if (info && info.username) {
    info.username = "FisherGO_Dev"; // ASCII bypass for Windows/Vercel bug
  }
  return info;
};

// Start Vercel after monkey-patching os module
await import('file:///C:/Users/palin/AppData/Roaming/npm/node_modules/vercel/dist/vc.js');
