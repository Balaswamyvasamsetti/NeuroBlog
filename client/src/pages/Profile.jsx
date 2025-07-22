import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import PostActions from '../components/PostActions';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function Profile() {
  const { user, logout } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, comments: 0, reactions: 0 });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null);

  useEffect(() => {
    if (user) {
      console.log('Current user:', user);
      setProfileData({ username: user.username, email: user.email });
      setProfilePhoto(user.profilePhoto || null);
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Make sure we have the user ID
      if (!user || !user.id) {
        console.error('No user ID available');
        setLoading(false);
        return;
      }
      
      console.log('Fetching posts for user ID:', user.id);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token available');
        setLoading(false);
        return;
      }
      
      // Get all posts including drafts by using the author query parameter
      // Use status=all to get both published and draft posts
      const postsResponse = await axios.get(`/api/posts?author=${user.id}&status=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('User posts response:', postsResponse.data);
      
      // No need to filter as we're already requesting only the user's posts
      const userPosts = postsResponse.data.posts || [];
      
      // Sort posts by creation date (newest first)
      const sortedPosts = [...userPosts].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setUserPosts(sortedPosts);
      
      // Get comments count for user's posts
      let commentsCount = 0;
      try {
        const commentsResponse = await axios.get('/api/comments/user-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        commentsCount = commentsResponse.data.count || 0;
      } catch (commentError) {
        console.error('Error fetching comments count:', commentError);
      }
      
      setStats({
        posts: sortedPosts.length,
        comments: commentsCount,
        reactions: sortedPosts.reduce((total, post) => total + (post.reactions?.length || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load your posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePostDeleted = (postId) => {
    // Remove the deleted post from the state
    const updatedPosts = userPosts.filter(post => post._id !== postId);
    setUserPosts(updatedPosts);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      posts: prev.posts - 1,
      reactions: updatedPosts.reduce((total, post) => total + (post.reactions?.length || 0), 0)
    }));
    
    toast.success('Post deleted successfully');
  };
  
  const handlePostStatusChange = (postId, newStatus) => {
    // Update the post status in the state
    const updatedPosts = userPosts.map(post => {
      if (post._id === postId) {
        return { ...post, status: newStatus };
      }
      return post;
    });
    
    setUserPosts(updatedPosts);
    toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEditMode(false);
      toast.success('✅ Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { authChecked } = useContext(AuthContext);

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
          isDark ? 'border-blue-400' : 'border-blue-600'
        }`}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-400 mb-4">Please log in to view your profile</h2>
        <Link to="/login" className="text-blue-400 hover:text-blue-300">Go to Login</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
          isDark ? 'border-blue-400' : 'border-blue-600'
        }`}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className={`text-6xl font-black mb-4 ${
              isDark 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600'
            }`}>
              Your Profile
            </h1>
            <p className={`text-xl font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>Manage your account and view your activity</p>
            <div className={`w-24 h-1 mx-auto mt-4 rounded-full ${
              isDark 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`}></div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className={`backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                isDark 
                  ? 'bg-gray-900/50 border-white/10' 
                  : 'bg-white/70 border-gray-200/50'
              }`}>
                {/* Avatar */}
                <div className="text-center mb-8">
                  <ProfilePhotoUpload 
                    currentPhoto={profilePhoto}
                    onPhotoUpdate={setProfilePhoto}
                  />
                  <h2 className={`text-3xl font-bold mt-6 mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{user.username}</h2>
                  <p className={`text-lg ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>{user.email}</p>
                  <div className="mt-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      user.role === 'admin' 
                        ? isDark 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : 'bg-red-100 text-red-700 border border-red-300'
                        : isDark
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}>
                      {user.role?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center mb-8">
                  <div className={`p-4 rounded-2xl ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
                  }`}>
                    <div className={`text-3xl font-black ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>{stats.posts}</div>
                    <div className={`text-sm font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Posts</div>
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
                  }`}>
                    <div className={`text-3xl font-black ${
                      isDark ? 'text-purple-400' : 'text-purple-600'
                    }`}>{stats.reactions}</div>
                    <div className={`text-sm font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Reactions</div>
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
                  }`}>
                    <div className={`text-3xl font-black ${
                      isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}>{stats.comments}</div>
                    <div className={`text-sm font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Comments</div>
                  </div>
                </div>
                
                {/* Follow Stats */}
                <div className="grid grid-cols-2 gap-4 text-center mb-8">
                  <div className={`p-4 rounded-2xl ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
                  }`}>
                    <div className={`text-2xl font-black ${
                      isDark ? 'text-green-400' : 'text-green-600'
                    }`}>{user.followersCount || 0}</div>
                    <div className={`text-sm font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Followers</div>
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
                  }`}>
                    <div className={`text-2xl font-black ${
                      isDark ? 'text-cyan-400' : 'text-cyan-600'
                    }`}>{user.followingCount || 0}</div>
                    <div className={`text-sm font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Following</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditMode(!editMode)}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl"
                  >
                    {editMode ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel Edit
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </span>
                    )}
                  </motion.button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/create"
                      className="block w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl transition-all duration-300 font-bold text-center shadow-xl hover:shadow-2xl"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create New Post
                      </span>
                    </Link>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Edit Profile Form */}
              <AnimatePresence>
                {editMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    className={`backdrop-blur-xl rounded-3xl p-8 border ${
                      isDark 
                        ? 'bg-gray-900/50 border-white/10' 
                        : 'bg-white/70 border-gray-200/50'
                    }`}
                  >
                    <h3 className={`text-2xl font-bold mb-8 ${
                      isDark 
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400' 
                        : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'
                    }`}>
                      <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </span>
                    </h3>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div>
                        <label className={`block text-lg font-bold mb-3 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Username
                          </span>
                        </label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                          className={`w-full p-6 rounded-2xl font-medium text-lg transition-all duration-300 focus:outline-none focus:ring-4 ${
                            isDark 
                              ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20' 
                              : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-lg font-bold mb-3 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email
                          </span>
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          className={`w-full p-6 rounded-2xl font-medium text-lg transition-all duration-300 focus:outline-none focus:ring-4 ${
                            isDark 
                              ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20' 
                              : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                          required
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save Changes
                        </span>
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User Posts */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                  isDark 
                    ? 'bg-gray-900/50 border-white/10' 
                    : 'bg-white/70 border-gray-200/50'
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      Your Posts
                    </span>
                  </h3>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/create"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
                    >
                      + New Post
                    </Link>
                  </motion.div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                      isDark ? 'border-blue-400' : 'border-blue-600'
                    }`}></div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mb-6 flex justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h4 className={`text-2xl font-bold mb-3 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>No posts yet</h4>
                    <p className={`text-lg mb-8 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Start sharing your thoughts with the world!</p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/create"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Your First Post
                        </span>
                      </Link>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userPosts.map((post, index) => (
                      <motion.div
                        key={post._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                          isDark 
                            ? 'bg-gray-800/30 border-white/10 hover:border-blue-500/30' 
                            : 'bg-gray-100/50 border-gray-200 hover:border-blue-500/30'
                        }`}
                      >
                        <div>
                          <Link to={`/post/${post._id}`} className="block">
                            <h4 className={`text-xl font-bold mb-3 transition-colors ${
                              isDark 
                                ? 'text-white hover:text-blue-400' 
                                : 'text-gray-900 hover:text-blue-600'
                            }`}>
                              {post.title}
                            </h4>
                            <p className={`text-base mb-4 line-clamp-2 ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {post.summary || (post.body && post.body.substring(0, 150)) || 'No preview available'}...
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                <span className={`px-3 py-1 rounded-full font-medium ${
                                  post.status === 'published' 
                                    ? isDark
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : 'bg-green-100 text-green-700 border border-green-300'
                                    : isDark
                                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                }`}>
                                  {post.status}
                                </span>
                                <span className={`font-medium ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>{new Date(post.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className={`flex items-center space-x-4 font-medium ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <span className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{color: '#ef4444'}}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  {post.reactions?.length || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{color: '#3b82f6'}}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                  </svg>
                                  {post.commentCount || 0}
                                </span>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Post Actions */}
                          <PostActions 
                            post={post} 
                            isDark={isDark} 
                            onPostDeleted={handlePostDeleted}
                            onPostStatusChange={handlePostStatusChange}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Profile;