// server/cluster.js — Node.js 멀티코어 클러스터링
// 무료 플랜: WEB_CONCURRENCY 미설정 시 단일 프로세스 실행 (512MB 보호)
// 유료 플랜: WEB_CONCURRENCY=2 (Standard) / =4 (Pro) 설정 시 자동 확장
const cluster = require('cluster');
const os = require('os');

// WEB_CONCURRENCY 미설정 → 1 (무료 플랜 안전 모드)
// Render.com Standard 이상 업그레이드 시 대시보드에서 설정
const numWorkers = parseInt(process.env.WEB_CONCURRENCY) || 1;

if (numWorkers === 1) {
  // 단일 프로세스 모드 (무료 플랜)
  console.log('[Server] 단일 프로세스 모드 (WEB_CONCURRENCY=1)');
  require('./index.js');
} else if (cluster.isPrimary) {
  console.log(`[Cluster] 마스터 프로세스 시작 (PID: ${process.pid})`);
  console.log(`[Cluster] Worker ${numWorkers}개 생성 중... (CPU: ${os.cpus().length}코어)`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Cluster] Worker ${worker.process.pid} 종료 → 재시작`);
    cluster.fork();
  });
} else {
  console.log(`[Cluster] Worker ${process.pid} 시작`);
  require('./index.js');
}
