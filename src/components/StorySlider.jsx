import React from 'react';

/**
 * StorySlider — 24시간 오늘 조황 스토리 슬라이더 (Phase 3)
 * - 피드 최상단 가로 스크롤 원형 슬라이더
 * - story.expiresAt 기반 24h TTL (서버 MongoDB TTL 인덱스와 연동)
 */
export default function StorySlider({ stories = [], onAddStory, onViewStory }) {
  return (
    <div style={{
      display: 'flex', gap: '14px', overflowX: 'auto',
      padding: '14px 16px 10px', scrollbarWidth: 'none',
      msOverflowStyle: 'none', borderBottom: '1px solid #F2F2F7',
      backgroundColor: '#fff', marginBottom: '4px',
    }}>
      {/* 내 스토리 추가 버튼 */}
      <div
        onClick={onAddStory}
        style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer', minWidth: '58px' }}
      >
        <div style={{
          width: '58px', height: '58px', borderRadius: '50%',
          border: '2px dashed #0056D2', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '26px', background: '#EEF4FF',
          margin: '0 auto',
        }}>
          <span style={{ color: '#0056D2', fontWeight: '900', fontSize: '24px', lineHeight: 1 }}>+</span>
        </div>
        <div style={{ fontSize: '10px', marginTop: '5px', color: '#0056D2', fontWeight: '800' }}>
          오늘 조황
        </div>
      </div>

      {/* 스토리 목록 */}
      {stories.map(story => {
        const storyId = String(story._id || story.id);
        // 만료까지 남은 시간 (h)
        const hoursLeft = story.expiresAt
          ? Math.max(0, Math.round((new Date(story.expiresAt) - Date.now()) / 3600000))
          : 24;

        return (
          <div
            key={storyId}
            onClick={() => onViewStory?.(story)}
            style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer', minWidth: '58px' }}
          >
            {/* 스토리 링 + 이미지 */}
            <div style={{
              width: '58px', height: '58px', borderRadius: '50%',
              overflow: 'hidden', margin: '0 auto',
              padding: '2.5px',
              background: 'linear-gradient(135deg, #FF5A5F, #FF9B26)',
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff' }}>
                {story.image ? (
                  <img
                    src={story.image}
                    alt={story.author}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', background: '#F2F2F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: '900', color: '#0056D2',
                  }}>
                    {story.author?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </div>

            {/* 닉네임 */}
            <div style={{
              fontSize: '10px', marginTop: '5px', color: '#1c1c1e', fontWeight: '700',
              maxWidth: '58px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {story.author}
            </div>

            {/* 만료 시간 */}
            <div style={{ fontSize: '9px', color: '#aaa', marginTop: '1px' }}>
              {hoursLeft}h
            </div>
          </div>
        );
      })}
    </div>
  );
}
