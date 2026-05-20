// patch-push2.cjs — FCM 내용 추가 (regex 방식)
const fs = require('fs');
let content = fs.readFileSync('server/index.js', 'utf8');

// CRLF → LF 정규화해서 작업
const hasCRLF = content.includes('\r\n');

const normalized = content.replace(/\r\n/g, '\n');

// socket.io 부분 뒤에 FCM 코드 삽입
const TARGET = `  // socket.io broadcast to all clients. Client filters by targetEmail.
  io.emit('push_notification', {
    targetEmail: userEmail,
    title: title,
    message: message,
    type: type,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  });
  logger.info(\`[앱 푸쉬 알림 전송] 대상:\${userEmail}, 제목:\${title}\`); // ✅ 22TH-C1: console.log → logger.info
}`;

const REPLACEMENT = `  // ① socket.io broadcast (포그라운드용)
  io.emit('push_notification', {
    targetEmail: userEmail,
    title: title,
    message: message,
    type: type,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  });

  // ② FCM 실제 푸시 (백그라운드/잠금화면용)
  const userId = user._id || user.id;
  if (userId) {
    pushService.sendToUser(userId, { title, body: message, data }).catch(() => {});
  }

  logger.info(\`[앱 푸쉬 알림 전송] 대상:\${userEmail}, 제목:\${title}\`);
}`;

if (!normalized.includes(TARGET)) {
  console.error('❌ TARGET not found');
  console.log('Context around line 2026:');
  const lines = normalized.split('\n');
  lines.slice(2024, 2038).forEach((l, i) => console.log((2025+i)+':', JSON.stringify(l)));
  process.exit(1);
}

let result = normalized.replace(TARGET, REPLACEMENT);

// CRLF 복원
if (hasCRLF) result = result.replace(/\n/g, '\r\n');

fs.writeFileSync('server/index.js', result, 'utf8');
console.log('✅ FCM 코드 삽입 완료');
