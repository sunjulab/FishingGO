/**
 * 📲 낚시GO 텔레그램 감사/치유 보고 알림 모듈
 * - 환경변수: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * - 미설정 시: 에러 없이 콘솔에만 출력 후 안전하게 스킵
 */
export async function sendTelegramReport({ status, title, details = [] }) {
  const token = process.env.TELEGRAM_BOT_TOKEN || ''; // ✅ SEC: 하드코딩 제거 — 환경변수 필수
  const chatId = process.env.TELEGRAM_CHAT_ID || '8249592094';

  if (!token || !chatId) {
    console.log(`ℹ️ [Telegram] TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID 미설정 — 알림 발송 스킵`);
    return false;
  }

  const icon = status === 'SUCCESS' ? '✅' : status === 'HEALED' ? '🔧' : '🚨';
  const kstTime = new Date(Date.now() + 9 * 3600000).toISOString().replace('T', ' ').slice(0, 16) + ' KST';

  let text = `${icon} *[낚시GO 물때 가디언 보고]*\n`;
  text += `⏰ *일시:* ${kstTime}\n`;
  text += `📌 *상태:* *${title}*\n\n`;

  if (details.length > 0) {
    text += details.map(d => `• ${d}`).join('\n') + '\n';
  }

  text += `\n🌐 [웹사이트 확인](https://www.fishing-go.com)`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }),
      signal: AbortSignal.timeout(5000)
    });

    const data = await res.json();
    if (data.ok) {
      console.log(`📲 [Telegram] 텔레그램 보고서 발송 완료 (chatId: ${chatId})`);
      return true;
    } else {
      console.warn(`⚠️ [Telegram] 텔레그램 API 응답 오류:`, data.description);
      return false;
    }
  } catch (err) {
    console.warn(`⚠️ [Telegram] 텔레그램 발송 실패:`, err.message);
    return false;
  }
}

// CLI 직접 실행 지원: node scripts/notify-telegram.mjs "SUCCESS" "21개 관측소 정상" "상세내용"
if (process.argv[1]?.endsWith('notify-telegram.mjs')) {
  const status = process.argv[2] || 'SUCCESS';
  const title = process.argv[3] || '정기 감사 완료';
  const details = process.argv.slice(4);
  sendTelegramReport({ status, title, details });
}
