/**
 * shareUtils.js - 낚시GO 외부 앱 공유 유틸리티
 *
 * 우선순위:
 *  1. navigator.share (Web Share API) → Android/iOS 네이티브 공유 시트
 *     카카오톡, 인스타그램, 라인, SMS, 카카오스토리 등 모든 앱 노출
 *  2. Kakao SDK → KakaoTalk 직접 공유 (Web Share 불가 시)
 *  3. 클립보드 복사 (최후 폴백)
 */

/**
 * 외부 앱 공유 (네이티브 공유 시트)
 * @param {object} params
 * @param {string} params.title - 공유 제목
 * @param {string} params.text  - 공유 내용
 * @param {string} params.url   - 공유 URL
 * @param {string} [params.imgUrl] - OG 이미지 URL (카카오 전용)
 * @param {function} params.addToast - toast 알림 함수
 * @returns {Promise<boolean>} 공유 성공 여부
 */
export async function shareExternal({ title, text, url, imgUrl, addToast }) {
  const pageUrl = url || window.location.href;
  const ogImg   = (imgUrl && imgUrl.startsWith('http'))
    ? imgUrl
    : `${window.location.origin}/og-image.png`;

  // ① Web Share API — 네이티브 공유 시트 (카카오톡·인스타·라인 등 전체 노출)
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: pageUrl });
      return true;
    } catch (e) {
      // 사용자가 취소한 경우 (AbortError) → 실패 아님
      if (e?.name === 'AbortError') return false;
      // 그 외 오류 → 카카오 폴백
    }
  }

  // ② KakaoTalk SDK 공유 (Web Share 미지원 환경 — 데스크탑 등)
  if (window.Kakao?.isInitialized()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description: text,
          imageUrl: ogImg,
          link: { mobileWebUrl: pageUrl, webUrl: pageUrl },
        },
        buttons: [{ title: '앱에서 보기', link: { mobileWebUrl: pageUrl, webUrl: pageUrl } }],
      });
      return true;
    } catch { /* 클립보드 폴백 */ }
  }

  // ③ 클립보드 복사 (최후 폴백)
  try {
    await navigator.clipboard.writeText(pageUrl);
    addToast?.('🔗 링크가 클립보드에 복사됐습니다!', 'success');
    return true;
  } catch {
    addToast?.('링크 복사에 실패했습니다.', 'error');
    return false;
  }
}
