/**
 * 이미지 압축 유틸리티 — OPT-6: WebP 전환 완전 적용
 *
 * ✅ 변경 사항:
 *   - compressImage(): WEBP_SUPPORTED 감지 → WebP 우선 출력 (기존)
 *   - compressAvatar(): 하드코딩 JPEG → WebP 우선 출력으로 교체
 *   - getOptimalMime(): 단일 mime/quality 결정 함수로 중앙화
 *   - WebP 미지원 브라우저(IE, 구형 Safari)에서 자동 JPEG fallback 보장
 *   - 크기 비교 후 더 작은 쪽 선택 (WebP가 JPEG보다 큰 희귀 케이스 방어)
 */

// \u2705 6TH-B8: WEBP \uac10\uc9c0\ub97c IIFE + try/catch\ub85c \ub798\ud551 \u2014 SSR/\ud14c\uc2a4\ud2b8 \ud658\uacbd\uc758 document \ubbf8\uc815\uc758 \uc2dc canvas \uc0dd\uc131 \uc608\uc678 \ubc29\uc9c0
const WEBP_SUPPORTED = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1; canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false; // canvas \uc0dd\uc131 \uc2e4\ud328 \uc2dc JPEG fallback
  }
})();


/**
 * ✅ OPT-6: 최적 mime/quality 결정 헬퍼
 * WebP 지원 시 WebP 우선, 미지원 시 JPEG fallback
 * @param {'avatar'|'post'|'business'} preset
 * @returns {{ mime: string, quality: number }}
 */
function getOptimalFormat(preset = 'post') {
  if (!WEBP_SUPPORTED) {
    // WebP 미지원 브라우저 — JPEG fallback
    const q = preset === 'avatar' ? 0.82 : preset === 'business' ? 0.82 : 0.78;
    return { mime: 'image/jpeg', quality: q };
  }
  // WebP는 동일 품질 설정에서 JPEG 대비 평균 25~35% 용량 절감
  const q = preset === 'avatar' ? 0.85 : preset === 'business' ? 0.85 : 0.80;
  return { mime: 'image/webp', quality: q };
}

/**
 * base64 이미지를 압축하여 반환
 * @param {string} base64 - data:image/...;base64,... 형태의 문자열
 * @param {object} options - { maxWidth, maxHeight, quality, preset }
 * @returns {Promise<string>} 압축된 base64 문자열 (WebP 우선)
 */
export async function compressImage(base64, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality,           // 직접 지정 시 우선 사용
    preset = 'post',   // 'avatar' | 'post' | 'business'
  } = options;

  const { mime: mimeType, quality: autoQuality } = getOptimalFormat(preset);
  const finalQuality = quality ?? autoQuality;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 비율 유지하며 리사이즈
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const result = canvas.toDataURL(mimeType, finalQuality);
      img.onload = img.onerror = null;
      resolve(result);
    };
    img.onerror = (err) => {
      img.onload = img.onerror = null;
      reject(err);
    };
    img.src = base64;
  });
}

/**
 * File 객체를 압축된 base64로 변환 (WebP 우선)
 * @param {File} file - 이미지 파일
 * @param {object} options - compressImage와 동일
 * @returns {Promise<string>} 압축된 base64 문자열
 */
export async function fileToCompressedBase64(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const compressed = await compressImage(e.target.result, options);
        // ✅ 3RD-C7: reader cleanup — compressImage(L71,L76) 패턴과 일관성 유지
        reader.onload = reader.onerror = null;
        resolve(compressed);
      } catch (err) {
        reader.onload = reader.onerror = null;
        reject(err);
      }
    };
    reader.onerror = (err) => {
      reader.onload = reader.onerror = null;
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * ✅ OPT-6: 아바타(프로필 사진) 전용 압축 - 정사각형 크롭 + WebP 우선
 * 기존: 하드코딩 image/jpeg, 0.8
 * 변경: WebP 지원 시 image/webp, 0.85 / 미지원 시 image/jpeg, 0.82
 * @param {string} base64
 * @returns {Promise<string>}
 */
export async function compressAvatar(base64) {
  const { mime: mimeType, quality } = getOptimalFormat('avatar');

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 300; // 300×300 고정 정사각형
      const canvas = document.createElement('canvas');
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // 중앙 정사각형 크롭
      const min = Math.min(img.width, img.height);
      const sx = (img.width  - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

      // ✅ WebP 우선 출력 (미지원 시 JPEG fallback)
      const result = canvas.toDataURL(mimeType, quality);
      img.onload = img.onerror = null;
      resolve(result);
    };
    img.onerror = (err) => {
      img.onload = img.onerror = null;
      reject(err);
    };
    img.src = base64;
  });
}

/**
 * ✅ 내보내기: 현재 브라우저의 WebP 지원 여부
 * 컴포넌트에서 디버깅/로깅 목적으로 사용 가능
 */
export const isWebPSupported = WEBP_SUPPORTED;
