// server/cluster.js — Node.js 멀티코어 클러스터링
// Render.com Standard(1 core) / Pro(2 core) / Pro Plus(4 core) 모두 자동 감지
const cluster = require('cluster');
const os = require('os');

// Render.com 환경: WEB_CONCURRENCY 환경변수로 workers 수 제어 가능
// 기본: CPU 코어 수 (단, 최대 4개 제한 — 메모리 안전)
const numCPUs = parseInt(process.env.WEB_CONCURRENCY) || Math.min(os.cpus().length, 4);

if (cluster.isPrimary) {
  console.log(`[Cluster] 마스터 프로세스 시작 (PID: ${process.pid})`);
  console.log(`[Cluster] Worker ${numCPUs}개 생성 중... (CPU: ${os.cpus().length}코어)`);

  // Worker 생성
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Worker 비정상 종료 시 자동 재시작
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Cluster] Worker ${worker.process.pid} 종료 (code: ${code}, signal: ${signal}) → 재시작`);
    cluster.fork();
  });

  // 주기적 상태 출력
  setInterval(() => {
    const workers = Object.values(cluster.workers);
    console.log(`[Cluster] 활성 Worker: ${workers.length}개`);
  }, 60000);

} else {
  // Worker: 실제 서버 로직 실행
  console.log(`[Cluster] Worker ${process.pid} 시작`);
  require('./index.js');
}
