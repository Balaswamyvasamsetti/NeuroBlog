import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import RelatedPosts from '../components/RelatedPosts';
import ShareButton from '../components/ShareButton';
import UserHoverCard from '../components/UserHoverCard';
import FollowButton from '../components/FollowButton';
import { toast } from 'react-hot-toast';

function Post() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReactions, setShowReactions] = useState(false);

  const reactions = [
    { emoji: '👍', name: 'Like' },
    { emoji: '❤️', name: 'Love' },
    { emoji: '🎉', name: 'Celebrate' }
  ];

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/comments/post/${id}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleReaction = async (emoji) => {
    if (!user) {
      toast.error('Please login to react to posts');
      return;
    }
    
    try {
      console.log('Sending reaction:', { emoji, userId: user.id });
      const response = await axios.post(
        `/api/posts/${id}/react`,
        { emoji },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      console.log('Reaction response:', response.data);
      setPost(prev => ({ ...prev, reactions: response.data }));
      toast.success('Reaction updated!');
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const handleReply = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    
    setCommentLoading(true);
    try {
      console.log('Posting comment:', { content, postId: id, parentId });
      const response = await axios.post(
        '/api/comments',
        { content, postId: id, parentId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      console.log('Comment response:', response.data);
      
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
        toast.success('Reply posted!');
      } else {
        setNewComment('');
        toast.success('Comment posted!');
      }
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const getUserReaction = () => {
    if (!user || !post.reactions) return null;
    return post.reactions.find(r => {
      const reactionUserId = typeof r.user === 'object' ? r.user._id || r.user.id : r.user;
      const currentUserId = user.id || user._id;
      return reactionUserId === currentUserId || reactionUserId.toString() === currentUserId.toString();
    });
  };

  const getReactionCounts = () => {
    if (!post.reactions) return {};
    return post.reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setCommentLoading(true);
    try {
      await axios.post(
        '/api/comments',
        { content: newComment, postId: id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
          isDark ? 'border-blue-400' : 'border-blue-600'
        }`}></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className={`text-2xl font-bold mb-4 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>Post not found</h2>
        <Link to="/" className={`${
          isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
        }`}>← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`rounded-2xl p-4 sm:p-6 border backdrop-blur-xl ${
              isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white/80 border-gray-200'
            }`}>
            <div className="mb-4 flex items-center justify-between">
              <Link to="/" className={`text-sm flex items-center space-x-1 ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}>
                <span>←</span>
                <span>Back to Posts</span>
              </Link>
              <div className="flex items-center space-x-3">
                {user && post.author && (user.id === post.author._id || user.role === 'admin') && (
                  <Link
                    to={`/edit/${post._id}`}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center space-x-2"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </Link>
                )}
                <ShareButton post={post} />
              </div>
            </div>
            
            <h1 className={`text-fluid-3xl font-bold mb-4 leading-tight ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {post.title}
            </h1>
            
            <div className={`flex flex-wrap items-center justify-between gap-4 mb-4 text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {post.author?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <UserHoverCard 
                    userId={post.author?._id} 
                    username={post.author?.username}
                  >
                    <Link 
                      to={`/user/${post.author?._id}`}
                      className={`font-medium hover:underline ${
                        isDark ? 'hover:text-blue-400' : 'hover:text-blue-600'
                      }`}
                    >
                      {post.author?.username || 'Anonymous'}
                    </Link>
                  </UserHoverCard>
                </div>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
                {post.category && (
                  <>
                    <span>•</span>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                      {post.category.name}
                    </span>
                  </>
                )}
              </div>
              
              {/* Quick Follow Button */}
              <FollowButton userId={post.author?._id} size="sm" />
            </div>
            
            {post.summary && (
              <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${
                isDark ? 'bg-gray-700/30' : 'bg-blue-50'
              }`}>
                <p className={`italic ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>{post.summary}</p>
              </div>
            )}
          </motion.div>

          {/* Featured Image */}
          {post.featuredImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-lg overflow-hidden border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.description}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="p-4">
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {post.featuredImage.description}
                </p>
                <p className={`text-xs mt-1 ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Photo by{' '}
                  <a
                    href={post.featuredImage.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}
                  >
                    {post.featuredImage.author}
                  </a>
                </p>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className={`rounded-2xl p-6 border backdrop-blur-xl ${
              isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white/70 border-gray-200'
            }`}>
            <div className={`leading-relaxed whitespace-pre-wrap ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {post.body || post.content}
            </div>
          </motion.div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className={`rounded-lg p-6 border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reactions - LinkedIn Style */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 border backdrop-blur-xl ${
              isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white/70 border-gray-200/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Like Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReaction('👍')}
                  disabled={!user}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    getUserReaction()?.emoji === '👍'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : isDark
                        ? 'bg-gray-700/50 hover:bg-blue-500/20 text-gray-300 hover:text-blue-400'
                        : 'bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-600'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-xl">👍</span>
                  <span>Like</span>
                  {getReactionCounts()['👍'] > 0 && (
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      getUserReaction()?.emoji === '👍'
                        ? 'bg-white/20'
                        : isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-200 text-blue-600'
                    }`}>
                      {getReactionCounts()['👍']}
                    </span>
                  )}
                </motion.button>
                
                {/* Love Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReaction('❤️')}
                  disabled={!user}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    getUserReaction()?.emoji === '❤️'
                      ? 'bg-red-600 text-white shadow-lg'
                      : isDark
                        ? 'bg-gray-700/50 hover:bg-red-500/20 text-gray-300 hover:text-red-400'
                        : 'bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-xl">❤️</span>
                  <span>Love</span>
                  {getReactionCounts()['❤️'] > 0 && (
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      getUserReaction()?.emoji === '❤️'
                        ? 'bg-white/20'
                        : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-200 text-red-600'
                    }`}>
                      {getReactionCounts()['❤️']}
                    </span>
                  )}
                </motion.button>
                
                {/* Celebrate Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReaction('🎉')}
                  disabled={!user}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    getUserReaction()?.emoji === '🎉'
                      ? 'bg-green-600 text-white shadow-lg'
                      : isDark
                        ? 'bg-gray-700/50 hover:bg-green-500/20 text-gray-300 hover:text-green-400'
                        : 'bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-600'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-xl">🎉</span>
                  <span>Celebrate</span>
                  {getReactionCounts()['🎉'] > 0 && (
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      getUserReaction()?.emoji === '🎉'
                        ? 'bg-white/20'
                        : isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-200 text-green-600'
                    }`}>
                      {getReactionCounts()['🎉']}
                    </span>
                  )}
                </motion.button>
              </div>
              
              {/* Total Reactions */}
              {post.reactions && post.reactions.length > 0 && (
                <div className={`text-sm px-3 py-2 rounded-full ${
                  isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}>
                  {post.reactions.length} {post.reactions.length === 1 ? 'reaction' : 'reactions'}
                </div>
              )}
            </div>
            
            {!user && (
              <div className={`mt-4 p-3 rounded-xl text-center ${
                isDark ? 'bg-gray-700/30' : 'bg-gray-100'
              }`}>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Link to="/login" className={
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }>Login</Link> to react to this post
                </p>
              </div>
            )}
          </motion.div>

          {/* Comments Section */}
          <div className={`rounded-lg p-6 border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <h3 className={`text-lg font-semibold mb-6 ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>Comments ({comments.length})</h3>
            
            {/* Comment Form */}
            {user ? (
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={(e) => handleReply(e)} 
                className="mb-8"
              >
                <div className="flex space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    isDark ? 'bg-blue-600' : 'bg-blue-600'
                  }`}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts and join the conversation..."
                      rows={4}
                      className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-4 resize-none ${
                        isDark 
                          ? 'bg-gray-700/50 border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    <div className="flex justify-between items-center mt-4">
                      <div className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Be respectful and constructive
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!newComment.trim() || commentLoading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        {commentLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <span>Comment</span>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.form>
            ) : (
              <div className={`mb-8 p-4 rounded-lg text-center ${
                isDark ? 'bg-gray-700/30' : 'bg-gray-100'
              }`}>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  <Link to="/login" className={
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }>Login</Link> to join the conversation
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center py-12 rounded-xl ${
                    isDark ? 'bg-gray-700/20' : 'bg-gray-100/50'
                  }`}
                >
                  <div className="text-6xl mb-4">💬</div>
                  <p className={`text-lg font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>No comments yet</p>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Be the first to share your thoughts!</p>
                </motion.div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-2xl border backdrop-blur-sm ${
                      isDark ? 'bg-gray-700/30 border-white/10' : 'bg-white/70 border-gray-200'
                    }`}
                  >
                    <div className="flex space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        ['bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-cyan-600'][index % 4]
                      }`}>
                        {comment.author?.username?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <UserHoverCard 
                              userId={comment.author?._id} 
                              username={comment.author?.username}
                            >
                              <span className={`font-bold text-lg hover:underline cursor-pointer ${
                                isDark ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                              }`}>{comment.author?.username || 'Anonymous'}</span>
                            </UserHoverCard>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              isDark ? 'bg-gray-600/50 text-gray-400' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {new Date(comment.createdAt).toLocaleDateString()} • {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`leading-relaxed mb-4 text-lg ${
                          isDark ? 'text-gray-200' : 'text-gray-800'
                        }`}>{comment.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {comment.upvotes > 0 && (
                              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                              }`}>
                                <span>👍</span>
                                <span className="font-medium">{comment.upvotes}</span>
                              </div>
                            )}
                          </div>
                          
                          {user && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                isDark 
                                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                              }`}
                            >
                              Reply
                            </motion.button>
                          )}
                        </div>
                        
                        {/* Reply Form */}
                        {replyingTo === comment._id && user && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-300/20"
                          >
                            <form onSubmit={(e) => handleReply(e, comment._id)} className="flex space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                                isDark ? 'bg-blue-600' : 'bg-blue-600'
                              }`}>
                                {user.username?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={`Reply to ${comment.author?.username || 'Anonymous'}...`}
                                  rows={3}
                                  className={`w-full p-3 border rounded-xl transition-all focus:outline-none focus:ring-2 resize-none ${
                                    isDark 
                                      ? 'bg-gray-600/50 border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20' 
                                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                                  }`}
                                />
                                <div className="flex justify-end space-x-2 mt-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent('');
                                    }}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                      isDark 
                                        ? 'bg-gray-600/50 hover:bg-gray-600 text-gray-300' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={!replyContent.trim() || commentLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all shadow-lg"
                                  >
                                    {commentLoading ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      'Reply'
                                    )}
                                  </motion.button>
                                </div>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Related Posts */}
          <div className="mt-8">
            <RelatedPosts currentPost={post} />
          </div>
        </motion.article>
      </div>
    </div>
  );
}

export default Post;