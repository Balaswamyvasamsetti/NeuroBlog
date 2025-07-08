import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AIAgent from '../components/AIAgent';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalComments: 0,
    totalReactions: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState({
    postsPerMonth: [],
    topTags: [],
    reactionStats: [],
    viewStats: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all posts (including drafts) for admin
      const postsResponse = await axios.get('/api/posts?limit=100&status=all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const posts = postsResponse.data.posts || postsResponse.data;
      setAllPosts(posts);
      setRecentPosts(posts.slice(0, 10));
      
      // Calculate stats
      const totalReactions = posts.reduce((total, post) => total + (post.reactions?.length || 0), 0);
      
      setStats({
        totalPosts: posts.length,
        totalUsers: 0, // Would need separate API
        totalComments: 0, // Would need separate API
        totalReactions
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Post deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-400 mb-4">Please log in to access admin dashboard</h2>
        <Link to="/login" className="text-blue-400 hover:text-blue-300">Go to Login</Link>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-400 mb-4">Access Restricted</h2>
        <p className="text-gray-500 mb-6">This area is restricted to administrators only.</p>
        <Link to="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Manage your NeuroBlog platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Total Posts</p>
                <p className="text-3xl font-bold text-white">{stats.totalPosts}</p>
              </div>
              <div className="text-4xl text-blue-400">📝</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl text-green-400">👥</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Total Comments</p>
                <p className="text-3xl font-bold text-white">{stats.totalComments}</p>
              </div>
              <div className="text-4xl text-purple-400">💬</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-400 text-sm font-medium">Total Reactions</p>
                <p className="text-3xl font-bold text-white">{stats.totalReactions}</p>
              </div>
              <div className="text-4xl text-pink-400">❤️</div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex space-x-4 mb-8 p-1 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'posts', label: '📝 All Posts', icon: '📝' },
            { id: 'analytics', label: '📈 Analytics', icon: '📈' },
            { id: 'ai-agent', label: '🤖 AI Agent', icon: '🤖' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-blue-600 text-white shadow-lg'
                  : isDark
                    ? 'text-gray-300 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Actions */}
            <div className={`backdrop-blur-lg rounded-2xl p-6 border mb-8 ${
              isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
            }`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/create"
                  className={`flex items-center space-x-3 p-4 border rounded-lg transition-all group ${
                    isDark 
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30' 
                      : 'bg-blue-100/50 hover:bg-blue-200/50 border-blue-300'
                  }`}
                >
                  <div className="text-2xl">➕</div>
                  <div>
                    <h3 className={`font-semibold transition-colors ${
                      isDark ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'
                    }`}>Create Post</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Write a new blog post</p>
                  </div>
                </Link>

                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center space-x-3 p-4 border rounded-lg transition-all group ${
                    isDark 
                      ? 'bg-green-600/20 hover:bg-green-600/30 border-green-500/30' 
                      : 'bg-green-100/50 hover:bg-green-200/50 border-green-300'
                  }`}
                >
                  <div className="text-2xl">📈</div>
                  <div className="text-left">
                    <h3 className={`font-semibold transition-colors ${
                      isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'
                    }`}>View Analytics</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Detailed platform stats</p>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('ai-agent')}
                  className={`flex items-center space-x-3 p-4 border rounded-lg transition-all group ${
                    isDark 
                      ? 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30' 
                      : 'bg-purple-100/50 hover:bg-purple-200/50 border-purple-300'
                  }`}
                >
                  <div className="text-2xl">🤖</div>
                  <div className="text-left">
                    <h3 className={`font-semibold transition-colors ${
                      isDark ? 'text-white group-hover:text-purple-400' : 'text-gray-900 group-hover:text-purple-600'
                    }`}>AI Agent</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Auto-generate content</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'overview' && (
          <div className={`backdrop-blur-lg rounded-2xl p-6 border ${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Posts</h2>
              <button 
                onClick={() => setActiveTab('posts')}
                className={`text-sm transition-colors ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                View All →
              </button>
            </div>
            
            {recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📝</div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No posts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPosts.map(post => (
                  <motion.div
                    key={post._id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isDark 
                        ? 'bg-gray-700/30 border-gray-600 hover:border-gray-500' 
                        : 'bg-gray-100/30 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex-1">
                      <Link to={`/post/${post._id}`} className="block">
                        <h3 className={`font-semibold mb-1 transition-colors ${
                          isDark ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                        }`}>
                          {post.title}
                        </h3>
                        <div className={`flex items-center space-x-4 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span>By {post.author?.username || 'Unknown'}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            post.status === 'published' 
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-yellow-600/20 text-yellow-400'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className={`flex items-center space-x-4 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span>👍 {post.reactions?.length || 0}</span>
                      <span>💬 0</span>
                      <Link 
                        to={`/edit/${post._id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        ✏️
                      </Link>
                      <button 
                        onClick={() => deletePost(post._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Posts Management */}
        {activeTab === 'posts' && (
          <div className={`backdrop-blur-lg rounded-2xl p-6 border ${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>All Posts Management</h2>
            
            {allPosts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📝</div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No posts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allPosts.map(post => (
                  <motion.div
                    key={post._id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isDark 
                        ? 'bg-gray-700/30 border-gray-600 hover:border-gray-500' 
                        : 'bg-gray-100/30 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex-1">
                      <Link to={`/post/${post._id}`} className="block">
                        <h3 className={`font-semibold mb-1 transition-colors ${
                          isDark ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                        }`}>
                          {post.title}
                        </h3>
                        <div className={`flex items-center space-x-4 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span>By {post.author?.username || 'Unknown'}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            post.status === 'published' 
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-yellow-600/20 text-yellow-400'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className={`flex items-center space-x-4 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span>👍 {post.reactions?.length || 0}</span>
                      <span>💬 0</span>
                      <Link 
                        to={`/edit/${post._id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit Post"
                      >
                        ✏️
                      </Link>
                      <button 
                        onClick={() => deletePost(post._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Post"
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className={`backdrop-blur-lg rounded-2xl p-6 border ${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Posts Analytics */}
              <div className={`p-6 rounded-xl border ${
                isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-100/30 border-gray-300'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Posts Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Published Posts</span>
                    <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {allPosts.filter(p => p.status === 'published').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Draft Posts</span>
                    <span className={`font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {allPosts.filter(p => p.status === 'draft').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Total Reactions</span>
                    <span className={`font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
                      {stats.totalReactions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Avg Reactions/Post</span>
                    <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {allPosts.length > 0 ? (stats.totalReactions / allPosts.length).toFixed(1) : '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className={`p-6 rounded-xl border ${
                isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-100/30 border-gray-300'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
                <div className="space-y-3">
                  {allPosts.slice(0, 5).map(post => (
                    <div key={post._id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {post.title}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        post.status === 'published' 
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Tags */}
              <div className={`p-6 rounded-xl border ${
                isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-100/30 border-gray-300'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(allPosts.flatMap(post => post.tags || [])))
                    .slice(0, 10)
                    .map(tag => (
                      <span 
                        key={tag}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDark 
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {tag}
                      </span>
                    ))
                  }
                </div>
              </div>

              {/* System Health */}
              <div className={`p-6 rounded-xl border ${
                isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-100/30 border-gray-300'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>System Health</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Database Status</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-sm font-medium">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>AI Service</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-sm font-medium">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Auto-Generation</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm font-medium">Running</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Agent Tab */}
        {activeTab === 'ai-agent' && <AIAgent />}

        {/* System Status - Only show in overview */}
        {activeTab === 'overview' && (
          <div className={`backdrop-blur-lg rounded-2xl p-6 border ${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Database</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Connected</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Service</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>WebSocket</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Running</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AdminDashboard;