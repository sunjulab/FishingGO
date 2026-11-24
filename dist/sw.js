// ✅ INSTALL-PWA(2026-11-25): 홈 화면·바탕화면 설치 조건용 최소 서비스 워커.
// 아무것도 저장(캐시)하지 않는다 — 배포하면 바로 새 버전이 보이는 지금 방식을 그대로 유지하기 위해서.
// 페이지 이동 요청만 네트워크로 그대로 넘기고, 오프라인이면 브라우저 기본 오류 화면을 보여 준다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request));
});
