#!/usr/bin/env node
// FishingGO 런처 - Node.js로 서버들을 동시 실행
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname);
const SERVER_DIR = path.join(ROOT, 'server');

console.log('\n🚀 낚시GO 서버 시작 중...\n');

// 백엔드 서버
const backend = spawn('npm', ['run', 'dev'], {
  cwd: SERVER_DIR,
  shell: true,
  stdio: 'inherit',
  windowsHide: false,
});

backend.on('error', (e) => console.error('[백엔드 오류]', e.message));

setTimeout(() => {
  // 프론트엔드 서버
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: ROOT,
    shell: true,
    stdio: 'inherit',
    windowsHide: false,
  });
  frontend.on('error', (e) => console.error('[프론트 오류]', e.message));
  
  setTimeout(() => {
    const open = spawn('cmd', ['/c', 'start', '', 'http://localhost:5173'], {
      shell: true,
      detached: true,
    });
    open.unref();
  }, 10000);
}, 4000);

process.on('SIGINT', () => {
  backend.kill();
  process.exit();
});
