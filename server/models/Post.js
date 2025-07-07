const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  summary: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [String],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  scheduleDate: Date,
  reactions: [{ emoji: String, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  featuredImage: {
    url: String,
    description: String,
    author: String,
    authorUrl: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

postSchema.index({ title: 'text', body: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);