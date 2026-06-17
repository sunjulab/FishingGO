/**
 * MultiImageUpload.jsx — 다중 이미지 업로드 UI 컴포넌트
 * - 최대 maxCount장 (기본 5장) 업로드 지원
 * - 각 이미지 압축 후 base64 저장
 * - 드래그 정렬, 삭제, 첫 번째 이미지 = 대표 이미지 배지
 */
import React, { useRef, useState } from 'react';
import { Image, X, Star, Edit2 } from 'lucide-react';
import { fileToCompressedBase64 } from '../utils/imageUtils';
import ImagePositionEditor from './ImagePositionEditor';
import apiClient from '../api/index';

const isVideoUrl = (s) => typeof s === 'string' && (s.match(/\.(mp4|mov|webm)$/i) || s.includes('video/upload'));

export default function MultiImageUpload({
  images = [],
  onChange,
  maxCount = 5,
  isLoading = false,
  label = '사진 추가',
}) {
  const inputRef = useRef(null);
  const [editingIdx, setEditingIdx] = useState(null); // 위치 편집 중인 이미지 인덱스
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // 동일 파일 재선택 가능
    if (!files.length) return;

    const remaining = maxCount - images.length;
    const toProcess = files.slice(0, remaining);

    setIsUploadingMedia(true);
    const compressed = await Promise.all(
      toProcess.map(async (file) => {
        if (file.type.startsWith('video/')) {
          if (file.size > 30 * 1024 * 1024) {
            alert('동영상은 최대 30MB까지만 업로드 가능합니다.');
            return null;
          }
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'fishinggo_video');
            const res = await apiClient.post('/api/upload/media', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 0 // 동영상 업로드는 용량이 커서 기본 타임아웃 해제
            });
            return res.data?.url || null;
          } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || err.message;
            alert(`동영상 업로드 실패: ${msg}`);
            return null;
          }
        }

        try {
          return await fileToCompressedBase64(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.82, preset: 'post' });
        } catch {
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          }).catch(() => null); 
        }
      })
    );
    setIsUploadingMedia(false);
    onChange([...images, ...compressed.filter(Boolean)].slice(0, maxCount));
  };

  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const moveLeft = (idx) => {
    if (idx === 0) return;
    const next = [...images];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveRight = (idx) => {
    if (idx === images.length - 1) return;
    const next = [...images];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  return (
    <div>
      {/* 이미지 썸네일 그리드 */}
      {images.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          marginBottom: '12px',
        }}>
          {images.map((src, idx) => (
            // ✅ BUG-FIX: 마지막 24바이트만 사용 시 base64 이미지 간 key 충돌 가능 → idx+앞12+뒤12 조합으로 안정화
            <div
              key={`${idx}_${src.slice(0, 12)}_${src.slice(-12)}`}
              style={{
                position: 'relative', width: '80px', height: '80px',
                borderRadius: '12px', overflow: 'visible',
                flexShrink: 0,
              }}
            >
              {isVideoUrl(src) ? (
                <video
                  src={src}
                  style={{
                    width: '80px', height: '80px',
                    objectFit: 'cover', borderRadius: '12px',
                    border: idx === 0 ? '2.5px solid #0056D2' : '2px solid #E5E5EA',
                    display: 'block',
                  }}
                  muted autoPlay loop playsInline
                />
              ) : (
                <img
                  src={src}
                  alt={`첨부 ${idx + 1}`}
                  style={{
                    width: '80px', height: '80px',
                    objectFit: 'cover', borderRadius: '12px',
                    border: idx === 0 ? '2.5px solid #0056D2' : '2px solid #E5E5EA',
                    display: 'block',
                  }}
                />
              )}

              {/* 대표 이미지 배지 */}
              {idx === 0 && (
                <div style={{
                  position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
                  background: '#0056D2', color: '#fff',
                  fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900',
                  padding: '2px 6px', borderRadius: '8px',
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '2px',
                }}>
                  <Star size={8} fill="#fff" /> 대표
                </div>
              )}

              {/* 위치 편집 버튼 */}
              <button
                onClick={() => setEditingIdx(idx)}
                title="위치 조정"
                style={{
                  position: 'absolute', top: '-6px', left: '-6px',
                  background: '#0056D2', border: 'none', borderRadius: '50%',
                  width: '20px', height: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                <Edit2 size={11} color="#fff" />
              </button>

              {/* 삭제 버튼 */}
              <button
                onClick={() => removeImage(idx)}
                style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  background: '#FF3B30', border: 'none', borderRadius: '50%',
                  width: '20px', height: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                <X size={11} color="#fff" />
              </button>

              {/* 순서 이동 버튼 (이미지 2장 이상) */}
              {images.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: '-22px', left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: '2px',
                }}>
                  <button
                    onClick={() => moveLeft(idx)}
                    disabled={idx === 0}
                    style={{
                      width: '18px', height: '18px', background: idx === 0 ? '#e0e0e0' : '#0056D2',
                      border: 'none', borderRadius: '4px', cursor: idx === 0 ? 'default' : 'pointer',
                      color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >‹</button>
                  <button
                    onClick={() => moveRight(idx)}
                    disabled={idx === images.length - 1}
                    style={{
                      width: '18px', height: '18px', background: idx === images.length - 1 ? '#e0e0e0' : '#0056D2',
                      border: 'none', borderRadius: '4px', cursor: idx === images.length - 1 ? 'default' : 'pointer',
                      color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >›</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 이미지 추가 버튼 (maxCount 미만일 때) */}
      {images.length < maxCount && (
        <div
          onClick={() => !isLoading && !isUploadingMedia && inputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: (isLoading || isUploadingMedia) ? '#FF9B26' : images.length > 0 ? '#0056D2' : '#666',
            fontSize: `calc(14px * var(--fs, 1))`, cursor: (isLoading || isUploadingMedia) ? 'not-allowed' : 'pointer',
            marginTop: images.length > 0 ? '28px' : 0,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/mp4,video/quicktime,video/webm"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div style={{
            width: '36px', height: '36px',
            backgroundColor: images.length > 0 ? 'rgba(0,86,210,0.05)' : '#f8f9fa',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: images.length > 0 ? '1.5px solid rgba(0,86,210,0.3)' : 'none',
          }}>
            {isLoading || isUploadingMedia
              ? <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#FF9B26', fontWeight: '800' }}>처리중</span>
              : <Image size={20} />
            }
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: `calc(13px * var(--fs, 1))` }}>
              {isUploadingMedia ? '동영상 처리 중...' : isLoading ? '사진 처리 중...' : `${label} (${images.length}/${maxCount})`}
            </div>
            {images.length === 0 && !isUploadingMedia && !isLoading && (
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#aaa', marginTop: '1px' }}>
                최대 {maxCount}장 | 순서 변경 가능
              </div>
            )}
          </div>
        </div>
      )}

      {/* 꽉 찬 경우 안내 */}
      {images.length >= maxCount && (
        <div style={{
          fontSize: `calc(12px * var(--fs, 1))`, color: '#888', fontWeight: '700',
          marginTop: images.length > 1 ? '28px' : '8px',
          padding: '8px 12px', background: '#F8F9FA', borderRadius: '10px',
        }}>
          📷 최대 {maxCount}장 등록 완료. 삭제 후 추가 가능합니다.
        </div>
      )}
      {/* 이미지 위치 조정 에디터 모달 */}
      {editingIdx !== null && images[editingIdx] && (
        <ImagePositionEditor
          src={images[editingIdx]}
          onConfirm={(newBase64) => {
            const next = [...images];
            next[editingIdx] = newBase64;
            onChange(next);
            setEditingIdx(null);
          }}
          onCancel={() => setEditingIdx(null)}
        />
      )}
    </div>
  );
}
