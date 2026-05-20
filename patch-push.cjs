// patch-push.cjs — sendAppPushNotification에 FCM 추가
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');

const OLD = `async function sendAppPushNotification(userEmail, type, title, message) {`;
const NEW = `async function sendAppPushNotification(userEmail, type, title, message, data = {}) {`;

const OLD_BODY = `  // socket.io broadcast to all clients. Client filters by targetEmail.
  io.emit('push_notification', {
    targetEmail: userEmail,
    title: title,
    message: message,
    type: type,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  });
  logger.info(\`[앱 푸쉬 알림 전송] 대상:\${userEmail}, 제목:\${title}\`); // ✅ 22TH-C1: console.log → logger.info
}`;

const NEW_BODY = `  // ① socket.io broadcast (포그라운드용)
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

let result = content;
if (!result.includes(OLD)) { console.error('ERROR: signature not found'); process.exit(1); }
result = result.replace(OLD, NEW);
if (!result.includes(OLD_BODY.replace(/\r\n/g, '\n').split('\n')[0])) {
  // Try CRLF version
  const OLD_BODY_CRLF = OLD_BODY.replace(/\n/g, '\r\n');
  const NEW_BODY_CRLF = NEW_BODY.replace(/\n/g, '\r\n');
  if (result.includes(OLD_BODY_CRLF)) {
    result = result.replace(OLD_BODY_CRLF, NEW_BODY_CRLF);
    console.log('Replaced with CRLF');
  } else {
    // Try normalized comparison
    console.log('Trying regex replacement...');
    result = result.replace(
      /\/\/ socket\.io broadcast to all clients\. Client filters by targetEmail\.\s+io\.emit\('push_notification'[\s\S]*?logger\.info\(`\[앱 푸쉬 알림 전송\][^`]*`\)[^;]*;\s*\}/,
      NEW_BODY.replace(/\n/g, '\r\n')
    );
    console.log('Regex replacement done');
  }
} else {
  result = result.replace(OLD_BODY, NEW_BODY);
  console.log('Replaced with LF');
}

fs.writeFileSync('server/index.js', result, 'utf8');
console.log('✅ patch-push.cjs 완료');
