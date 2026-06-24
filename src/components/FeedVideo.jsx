import React, { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useVideoStore } from '../store/videoStore';

const FeedVideo = ({ src, style, className, onError, hideToggle = false }) => {
  const videoRef = useRef(null);
  const { isGlobalMuted, toggleMute } = useVideoStore();
  const [isVisible, setIsVisible] = useState(false);

  // 화면 노출 시 자동재생 제어 (Intersection Observer)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          if (entry.isIntersecting) {
            // 화면에 50% 이상 노출되면 재생 시도
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.log('Autoplay prevented by browser:', error);
              });
            }
          } else {
            // 화면에서 벗어나면 일시정지
            video.pause();
          }
        });
      },
      { threshold: 0.5 } // 화면에 50% 보일 때 트리거
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
      observer.disconnect();
    };
  }, []);

  // 전역 음소거 상태 동기화
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isGlobalMuted;
    }
  }, [isGlobalMuted]);

  const handleToggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 부모 엘리먼트 클릭(상세보기 등) 방지
    toggleMute();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }} className={className}>
      <video
        ref={videoRef}
        src={src}
        style={{ width: '100%', height: '100%', objectFit: style?.objectFit || 'cover', display: 'block' }}
        loop
        playsInline
        muted={isGlobalMuted} // 초기 렌더링 시점에 적용
        onError={onError}
      />
      
      {/* 음소거 토글 오버레이 UI */}
      {!hideToggle && (
        <button
          onClick={handleToggleMute}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: 'white'
          }}
          aria-label="Toggle Mute"
        >
          {isGlobalMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
};

export default FeedVideo;
