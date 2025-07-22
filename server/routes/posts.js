const express = require('express');
const authMiddleware = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const webpush = require('web-push');
const router = express.Router();

// Get all posts with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status = 'published', author, tags, dateRange, sortBy = 'newest', readingTime, authorType } = req.query;
    const query = {};
    
    // Admin can see all posts, regular users only published
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let isAdmin = false;
    let userId = null;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isAdmin = decoded.role === 'admin';
        userId = decoded.userId;
      } catch (e) {}
    }
    
    // If author parameter is provided and matches the current user, show all their posts
    const isViewingOwnPosts = author && userId && author === userId;
    
    if (status === 'all' && (isAdmin || isViewingOwnPosts)) {
      // Don't filter by status for admins or users viewing their own posts with status=all
    } else if (!isAdmin && !isViewingOwnPosts) {
      // Regular users can only see published posts from others
      query.status = 'published';
    } else if (status !== 'all') {
      // Apply specific status filter if provided
      query.status = status;
    }
    
    if (category) query.category = category;
    if (author) query.author = author;
    
    // Tags filter with normalization
    if (tags) {
      const { normalizeTags } = require('../utils/tagNormalizer');
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      const normalizedTags = normalizeTags(tagArray);
      
      // Create regex for each normalized tag to match variations
      const tagRegexArray = normalizedTags.map(tag => {
        const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escapedTag, 'i');
      });
      
      query.tags = { $in: tagRegexArray };
    }
    
    // Date range filter
    if (dateRange) {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }
    
    // Reading time filter (based on content length)
    if (readingTime) {
      switch (readingTime) {
        case 'quick':
          query.$expr = { $lt: [{ $strLenCP: '$body' }, 1500] }; // < 5 min read
          break;
        case 'medium':
          query.$expr = { 
            $and: [
              { $gte: [{ $strLenCP: '$body' }, 1500] },
              { $lt: [{ $strLenCP: '$body' }, 3000] }
            ]
          }; // 5-10 min read
          break;
        case 'long':
          query.$expr = { $gte: [{ $strLenCP: '$body' }, 3000] }; // > 10 min read
          break;
      }
    }
    
    // Sorting
    let sortOption = { createdAt: -1 };
    switch (sortBy) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { 'reactions.length': -1, createdAt: -1 };
        break;
      case 'trending':
        // Posts with recent activity (reactions/comments)
        sortOption = { updatedAt: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    const posts = await Post.find(query)
      .populate('author', 'username')
      .populate('category', 'name')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Add comment count to each post
    const Comment = require('../models/Comment');
    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return { ...post.toObject(), commentCount };
      })
    );
    
    // Log the posts with comment counts for debugging
    console.log(`Found ${postsWithCommentCount.length} posts with comment counts`);
    
    const total = await Post.countDocuments(query);
    res.json({ posts: postsWithCommentCount, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username email')
      .populate('category', 'name');
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Check if post is a draft and restrict access
    if (post.status === 'draft') {
      // Get user from token if available
      const token = req.header('Authorization')?.replace('Bearer ', '');
      let isAuthorized = false;
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const isAdmin = decoded.role === 'admin';
          const isAuthor = post.author._id.toString() === decoded.userId;
          
          isAuthorized = isAdmin || isAuthor;
        } catch (e) {}
      }
      
      if (!isAuthorized) {
        return res.status(404).json({ error: 'Post not found' });
      }
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, body, summary, category, tags, status = 'draft', scheduleDate } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    
    const post = new Post({
      title,
      body,
      summary,
      author: req.user.userId,
      category: category || null,
      tags: tags || [],
      status,
      scheduleDate
    });
    
    await post.save();
    await post.populate('author', 'username');
    
    // Send notifications if published
    if (status === 'published') {
      const users = await User.find({ subscriptions: { $exists: true, $ne: [] } });
      const payload = JSON.stringify({
        title: 'New Post Published!',
        body: `${post.title} by ${post.author.username}`,
        url: `/post/${post._id}`
      });
      
      users.forEach(user => {
        user.subscriptions.forEach(subscription => {
          webpush.sendNotification(subscription, payload).catch(console.error);
        });
      });
    }
    
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Allow admin to edit any post, or author to edit their own
    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { title, body, summary, category, tags, status, scheduleDate } = req.body;
    
    Object.assign(post, {
      title: title || post.title,
      body: body || post.body,
      summary: summary || post.summary,
      category: category || post.category,
      tags: tags || post.tags,
      status: status || post.status,
      scheduleDate: scheduleDate || post.scheduleDate,
      updatedAt: new Date()
    });
    
    await post.save();
    await post.populate('author', 'username');
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Allow admin to delete any post, or author to delete their own
    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add reaction to post (single reaction per user)
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    console.log('Reaction request:', { emoji, userId: req.user.userId, currentReactions: post.reactions });
    
    // Find existing reaction from this user
    const existingReactionIndex = post.reactions.findIndex(
      r => r.user.toString() === req.user.userId
    );
    
    if (existingReactionIndex !== -1) {
      // User already has a reaction
      const existingReaction = post.reactions[existingReactionIndex];
      if (existingReaction.emoji === emoji) {
        // Same emoji - remove reaction (toggle off)
        post.reactions.splice(existingReactionIndex, 1);
        console.log('Removed existing reaction');
      } else {
        // Different emoji - update reaction
        post.reactions[existingReactionIndex].emoji = emoji;
        console.log('Updated existing reaction');
      }
    } else {
      // No existing reaction - add new one
      post.reactions.push({ emoji, user: req.user.userId });
      console.log('Added new reaction');
    }
    
    await post.save();
    console.log('Final reactions:', post.reactions);
    res.json(post.reactions);
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Search posts
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const posts = await Post.find({
      $text: { $search: query },
      status: 'published'
    })
    .populate('author', 'username')
    .populate('category', 'name')
    .sort({ score: { $meta: 'textScore' } });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get popular tags
router.get('/popular-tags', async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' }).select('tags');
    const tagCounts = {};
    
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    const popularTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
    
    res.json(popularTags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;