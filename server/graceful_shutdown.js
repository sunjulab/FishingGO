/**
 * graceful_shutdown.js — Render 배포 graceful shutdown 핸들러
 * ✅ FIX-SIGTERM: server/index.js에서 require('./graceful_shutdown')(server, mongoose) 호출
 * ✅ BUG-FIX: flushAllData 통합 — 서버 종료 전 인메모리 데이터 파일 동기화 보장
 */
module.exports = function registerShutdownHandlers(server, mongoose, flushAllData) {
  // ✅ BUG-FIX: 종료 시점에는 logger가 이미 해제될 수 있으므로 stderr fallback 사용
  const _log  = (msg) => (global.logger?.info  || ((m) => process.stdout.write(m + '\n')))(msg);
  const _warn = (msg) => (global.logger?.warn  || ((m) => process.stderr.write(m + '\n')))(msg);
  const _err  = (msg) => (global.logger?.error || ((m) => process.stderr.write(m + '\n')))(msg);

  function gracefulShutdown(signal) {
    _log(`\n[Server] ${signal} 수신 — graceful shutdown 시작...`);
    server.close(async () => {
      _log('[Server] HTTP 서버 닫힘 — 데이터 플러시 및 DB 연결 해제 중...');
      // ✅ BUG-FIX: 인메모리 데이터 파일 동기화 (SIGTERM 이전의 중복 핸들러 제거로 이 위치로 통합)
      if (typeof flushAllData === 'function') {
        try { flushAllData(); } catch (e) { _warn('[Server] flushAllData 실패: ' + e.message); }
      }
      try { await mongoose.connection.close(); _log('[Server] MongoDB 연결 해제 완료'); }
      catch (e) { _warn('[Server] MongoDB 해제 오류: ' + e.message); }
      process.exit(0);
    });
    // Render 기본 SIGKILL 타임아웃보다 2초 빠르게 강제 종료
    setTimeout(() => {
      _err('[Server] Graceful shutdown 타임아웃 — 강제 종료');
      process.exit(1);
    }, 28000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  // 미처리 예외: 로그 남기고 재시작
  process.on('uncaughtException', (err) => {
    _err('[Server] ❌ uncaughtException: ' + (err.stack || err.message));
    if (typeof flushAllData === 'function') {
      try { flushAllData(); } catch { /* 무시 */ }
    }
    gracefulShutdown('uncaughtException');
  });

  // Promise 거부: 로그만 (서버는 계속 실행)
  process.on('unhandledRejection', (reason) => {
    _err('[Server] ⚠️ unhandledRejection: ' + (reason instanceof Error ? reason.stack : reason));
  });

  _log('✅ Graceful shutdown 핸들러 등록 완료 (SIGTERM/SIGINT/uncaughtException/unhandledRejection)');
};

