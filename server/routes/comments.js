const express = require('express');
const authMiddleware = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const router = express.Router();

// Get comments for a post with nested replies
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId, parent: null })
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    
    // Get replies for each comment
    for (let comment of comments) {
      const replies = await Comment.find({ parent: comment._id })
        .populate('author', 'username')
        .sort({ createdAt: 1 });
      comment.replies = replies;
    }
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new comment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, postId, parentId } = req.body;
    
    if (!content || !postId) {
      return res.status(400).json({ error: 'Content and postId are required' });
    }
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // If parentId provided, verify parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }
    
    const comment = new Comment({
      content,
      post: postId,
      author: req.user.userId,
      parent: parentId || null
    });
    
    await comment.save();
    await comment.populate('author', 'username');
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update comment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    if (comment.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    comment.content = content;
    await comment.save();
    await comment.populate('author', 'username');
    res.json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete comment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    if (comment.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Delete all replies to this comment
    await Comment.deleteMany({ parent: req.params.id });
    await Comment.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upvote comment
router.post('/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    comment.upvotes += 1;
    await comment.save();
    res.json({ upvotes: comment.upvotes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comment stats for current user
router.get('/user-stats', authMiddleware, async (req, res) => {
  try {
    // Get posts by the user
    const posts = await Post.find({ author: req.user.userId }).select('_id');
    const postIds = posts.map(post => post._id);
    
    // Count comments on user's posts
    const commentsOnPosts = await Comment.countDocuments({ post: { $in: postIds } });
    
    // Count comments made by the user
    const commentsByUser = await Comment.countDocuments({ author: req.user.userId });
    
    res.json({
      count: commentsOnPosts,
      userComments: commentsByUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;