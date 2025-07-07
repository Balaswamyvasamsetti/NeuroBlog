const mongoose = require('mongoose');

const blogSuggestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String, required: true },
  tags: [String],
  category: String,
  source: { type: String, required: true }, // News source or topic
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'published'], 
    default: 'pending' 
  },
  adminNotes: String,
  generatedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  publishedAt: Date,
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});

module.exports = mongoose.model('BlogSuggestion', blogSuggestionSchema);