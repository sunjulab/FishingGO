// patch-chat-push.cjs — 크루 채팅 메시지 전송 시 FCM 알림 추가
const fs = require('fs');
let content = fs.readFileSync('server/index.js', 'utf8');
const hasCRLF = content.includes('\r\n');
let text = content.replace(/\r\n/g, '\n');

// 일반 텍스트 메시지 저장 후 FCM 발송
const TARGET = `    if (dbReady && ChatMessage) {
      try {
        await new ChatMessage({ crewId: data.crewId, sender: msgData.sender, text: msgData.text, time: msgData.time }).save();
        if (chatHistories[data.crewId]?.length % 50 === 0) saveChatHistories();
      } catch (e) { logger.error(\`[Socket] send_msg DB 저장 실패 (crewId=\${data.crewId}): \${e.message}\`); }
    } else { saveChatHistories(); }
  });`;

const REPLACEMENT = `    if (dbReady && ChatMessage) {
      try {
        await new ChatMessage({ crewId: data.crewId, sender: msgData.sender, text: msgData.text, time: msgData.time }).save();
        if (chatHistories[data.crewId]?.length % 50 === 0) saveChatHistories();
      } catch (e) { logger.error(\`[Socket] send_msg DB 저장 실패 (crewId=\${data.crewId}): \${e.message}\`); }
    } else { saveChatHistories(); }

    // ✅ PUSH: 크루 멤버에게 FCM 알림 (오프라인/백그라운드)
    try {
      if (dbReady && Crew) {
        const crew = await Crew.findById(data.crewId).select('members').lean();
        if (crew?.members?.length) {
          const memberIds = crew.members
            .filter(m => String(m.userId || m) !== String(verifiedUser?.id || verifiedUser?._id))
            .map(m => m.userId || m);
          if (memberIds.length) {
            pushService.sendToUsers(memberIds, {
              title: \`💬 \${sender}\`,
              body: text.length > 50 ? text.slice(0, 50) + '…' : text,
              data: { route: \`/crew/\${data.crewId}/chat\`, type: 'crew_chat' },
            }).catch(() => {});
          }
        }
      }
    } catch (e) { /* FCM 크루 알림 실패 무시 */ }
  });`;

if (!text.includes(TARGET)) {
  console.error('❌ chat TARGET not found');
  process.exit(1);
}
text = text.replace(TARGET, REPLACEMENT);
if (hasCRLF) text = text.replace(/\n/g, '\r\n');
fs.writeFileSync('server/index.js', text, 'utf8');
console.log('✅ 채팅 FCM 알림 추가 완료');
