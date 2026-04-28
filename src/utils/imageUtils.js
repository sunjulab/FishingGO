/**
 * 이미지 압축 유틸리티
 * 업로드 전 클라이언트 측에서 이미지를 리사이즈/압축하여 서버 부하와 DB 용량을 절약합니다.
 */

/**
 * base64 이미지를 압축하여 반환
 * @param {string} base64 - data:image/...;base64,... 형태의 문자열
 * @param {object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<string>} 압축된 base64 문자열
 */
export async function compressImage(base64, options = {}) {
  const {
    maxWidth  = 800,   // 최대 너비 (px)
    maxHeight = 800,   // 최대 높이 (px)
    quality   = 0.75,  // JPEG 품질 (0~1)
  } = options;

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

      // WebP 지원 시 WebP, 아니면 JPEG
      const mimeType = canvas.toDataURL('image/webp').startsWith('data:image/webp')
        ? 'image/webp'
        : 'image/jpeg';

      resolve(canvas.toDataURL(mimeType, quality));
    };
    img.onerror = reject;
    img.src = base64;
  });
}

/**
 * File 객체를 압축된 base64로 변환
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
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 아바타(프로필 사진) 전용 압축 - 정사각형 크롭
 * @param {string} base64
 * @returns {Promise<string>}
 */
export async function compressAvatar(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 300; // 300x300 고정
      const canvas = document.createElement('canvas');
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // 중앙 정사각형 크롭
      const min = Math.min(img.width, img.height);
      const sx = (img.width  - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = base64;
  });
}
