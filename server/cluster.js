// server/cluster.js — Node.js 멀티코어 클러스터링
// 무료 플랜: WEB_CONCURRENCY 미설정 시 단일 프로세스 실행 (512MB 보호)
// 유료 플랜: WEB_CONCURRENCY=2 (Standard) / =4 (Pro) 설정 시 자동 확장
const cluster = require('cluster');
const os = require('os');

// WEB_CONCURRENCY 미설정 → 1 (무료 플랜 안전 모드)
const numWorkers = parseInt(process.env.WEB_CONCURRENCY) || 1;

// ✅ FIX-CLUSTER-RESTART: 재시작 제한 (무한 루프 방지)
const MAX_RESTARTS = 10;       // 최대 재시작 횟수
const RESTART_WINDOW_MS = 60 * 1000; // 1분 이내
const RESTART_DELAY_MS = 2000; // 재시작 전 2초 대기
const restartLog = []; // { pid, time }

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
    const now = Date.now();
    // 1분 이내 재시작 횟수 카운트
    restartLog.push({ pid: worker.process.pid, time: now });
    // 오래된 기록 제거
    while (restartLog.length > 0 && now - restartLog[0].time > RESTART_WINDOW_MS) {
      restartLog.shift();
    }

    console.log(`[Cluster] Worker ${worker.process.pid} 종료 (code=${code}, signal=${signal}) → 재시작 시도 ${restartLog.length}/${MAX_RESTARTS}`);

    if (restartLog.length >= MAX_RESTARTS) {
      console.error(`[Cluster] ⚠️ 1분 내 ${MAX_RESTARTS}회 재시작 한도 초과 — 재시작 중단 (크래시 루프 감지)`);
      // 30초 후 한 번 더 시도 (일시적 문제일 수 있음)
      setTimeout(() => {
        console.log('[Cluster] 30초 대기 후 재시작 재시도...');
        restartLog.length = 0; // 카운터 리셋
        cluster.fork();
      }, 30000);
      return;
    }

    // 재시작 전 잠시 대기 (backoff)
    setTimeout(() => {
      cluster.fork();
    }, RESTART_DELAY_MS);
  });
} else {
  console.log(`[Cluster] Worker ${process.pid} 시작`);
  require('./index.js');
}
