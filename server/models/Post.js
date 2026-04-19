const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author:    { type: String, required: true },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  author:       { type: String, required: true },
  author_email: { type: String, required: true },
  category:     { type: String, required: true },
  content:      { type: String, required: true },
  image:        { type: String, default: null },
  likes:        { type: Number, default: 0 },
  comments:     { type: [commentSchema], default: [] },  // ← 댓글 배열
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
