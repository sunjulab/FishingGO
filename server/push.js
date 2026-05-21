// server/push.js — Firebase Admin SDK 푸시 알림 서비스
const admin = require('firebase-admin');

let initialized = false;

// FCM 초기화 상태 조회 (health endpoint에서 사용)
function isInitialized() { return initialized; }

function initFirebase() {
  if (initialized) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    console.warn('[PUSH] ⚠️ FIREBASE_SERVICE_ACCOUNT 환경변수 미설정 — 푸시 알림 비활성화');
    return;
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        typeof serviceAccount === 'string'
          ? JSON.parse(serviceAccount)
          : serviceAccount
      ),
    });
    initialized = true;
    console.log('[PUSH] ✅ Firebase Admin SDK 초기화 완료');
  } catch (e) {
    console.error('[PUSH] ❌ Firebase 초기화 실패:', e.message);
  }
}

// ─── 단일 토큰으로 발송 ───────────────────────────────────
async function sendToToken(token, { title, body, data = {}, imageUrl } = {}) {
  if (!initialized) return null;
  try {
    const msg = {
      token,
      notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'fishing-go-default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    };
    const result = await admin.messaging().send(msg);
    return result;
  } catch (err) {
    // 만료된 토큰은 삭제
    if (err.code === 'messaging/registration-token-not-registered') {
      const PushToken = require('./models/PushToken');
      await PushToken.deleteOne({ token });
    }
    return null;
  }
}

// ─── 유저 ID로 발송 ───────────────────────────────────────
async function sendToUser(userId, payload) {
  if (!initialized) return;
  const PushToken = require('./models/PushToken');
  const tokens = await PushToken.find({ userId }).select('token').lean();
  if (!tokens.length) return;
  await Promise.allSettled(tokens.map(t => sendToToken(t.token, payload)));
}

// ─── 여러 유저 ID로 발송 ─────────────────────────────────
async function sendToUsers(userIds, payload) {
  if (!initialized) return;
  const PushToken = require('./models/PushToken');
  const tokens = await PushToken.find({ userId: { $in: userIds } }).select('token').lean();
  if (!tokens.length) return;
  await Promise.allSettled(tokens.map(t => sendToToken(t.token, payload)));
}

// ─── 전체 발송 (Multicast, 최대 500개씩) ─────────────────
async function sendToAll(payload) {
  if (!initialized) return;
  const PushToken = require('./models/PushToken');
  const allTokens = await PushToken.find().select('token').lean();
  const tokenList = allTokens.map(t => t.token);

  for (let i = 0; i < tokenList.length; i += 500) {
    const chunk = tokenList.slice(i, i + 500);
    try {
      const { title, body, data = {}, imageUrl } = payload;
      await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'fishing-go-default' },
        },
      });
    } catch (e) {
      console.error('[PUSH] sendToAll chunk error:', e.message);
    }
  }
  console.log(`[PUSH] 전체 발송 완료 (${tokenList.length}개 기기)`);
}

// ─── 크루 채팅 알림 ───────────────────────────────────────
async function notifyCrewMessage({ crewId, senderName, message, memberIds, senderId }) {
  const targets = memberIds.filter(id => String(id) !== String(senderId));
  if (!targets.length) return;
  await sendToUsers(targets, {
    title: `💬 ${senderName}`,
    body: message.length > 50 ? message.slice(0, 50) + '…' : message,
    data: { route: `/crew-chat/${crewId}`, type: 'crew_chat' },
  });
}

// ─── 댓글/좋아요 알림 ────────────────────────────────────
async function notifyPostReaction({ authorId, actorName, postId, type }) {
  const messages = {
    comment: `💬 ${actorName}님이 댓글을 달았어요`,
    like:    `❤️ ${actorName}님이 좋아요를 눌렀어요`,
  };
  await sendToUser(authorId, {
    title: '낚시GO',
    body: messages[type] || `${actorName}님의 반응`,
    data: { route: `/post/${postId}`, type },
  });
}

// ─── 공지 전체 발송 ───────────────────────────────────────
async function notifyAnnouncement({ title, body }) {
  await sendToAll({
    title: `📢 ${title}`,
    body,
    data: { route: '/mypage', type: 'announcement' },
  });
}

module.exports = {
  initFirebase,
  isInitialized,
  sendToToken,
  sendToUser,
  sendToUsers,
  sendToAll,
  notifyCrewMessage,
  notifyPostReaction,
  notifyAnnouncement,
};
