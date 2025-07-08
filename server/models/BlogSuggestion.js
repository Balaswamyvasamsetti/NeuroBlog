const mongoose = require('mongoose');

const blogSuggestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String, required: true },
  tags: [String],
  category: String,
  source: { type: String, required: true }, // News source or topic
  newsUrl: String, // Original news URL
  uniqueId: String, // Unique identifier for duplicate prevention
  featured: { type: Boolean, default: true }, // Featured blog post
  readTime: String, // Estimated read time
  publishDate: String, // Formatted publish date
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

// Index for better duplicate detection
blogSuggestionSchema.index({ uniqueId: 1 });
blogSuggestionSchema.index({ title: 'text', source: 'text' });

module.exports = mongoose.model('BlogSuggestion', blogSuggestionSchema);