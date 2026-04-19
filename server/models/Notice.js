const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  isPinned:  { type: Boolean, default: false },
  author:    { type: String, default: 'MASTER' },
  views:     { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notice', noticeSchema);
