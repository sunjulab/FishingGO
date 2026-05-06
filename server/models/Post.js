const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author:       { type: String, required: true },
  author_email: { type: String, default: '' },  // 댓글 작성자 이메일 (차단/신고용)
  text:         { type: String, required: true },
  createdAt:    { type: Date, default: Date.now },
});


const postSchema = new mongoose.Schema({
  author:       { type: String, required: true },
  author_email: { type: String, required: true },
  category:     { type: String, required: true },
  content:      { type: String, required: true },
  image:        { type: String, default: null },
  likes:        { type: Number, default: 0 },
  likedBy:      { type: [String], default: [] },  // 좋아요 중복방지: 유저 이메일 목록
  comments:     { type: [commentSchema], default: [] },
  createdAt:    { type: Date, default: Date.now }
});

// ─── 검색 성능 최적화: 풀텍스트 인덱스 ─────────────────────────────────────
postSchema.index({ content: 'text', author: 'text' }); // $text 검색 지원
postSchema.index({ category: 1, createdAt: -1 });       // 카테고리 필터 + 최신순
postSchema.index({ author_email: 1 });                   // 작성자 이메일 조회
postSchema.index({ likedBy: 1 });                        // ✅ 10TH-B4: 좋아요 중복체크 $in 쿼리 full-scan 방지

module.exports = mongoose.model('Post', postSchema);
