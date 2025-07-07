import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
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
    if (!user) {
      navigate('/login');
      return;
    }
    setProfileData({ username: user.username, email: user.email });
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      const postsResponse = await axios.get('/api/posts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const userPosts = postsResponse.data.posts?.filter(post => post.author._id === user.id) || [];
      setUserPosts(userPosts);
      
      setStats({
        posts: userPosts.length,
        comments: 0,
        reactions: userPosts.reduce((total, post) => total + (post.reactions?.length || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
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
                <div className="grid grid-cols-2 gap-4 text-center mb-8">
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
                    {editMode ? '❌ Cancel Edit' : '✏️ Edit Profile'}
                  </motion.button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/create"
                      className="block w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl transition-all duration-300 font-bold text-center shadow-xl hover:shadow-2xl"
                    >
                      ✨ Create New Post
                    </Link>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl"
                  >
                    🚪 Logout
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
                    }`}>✏️ Edit Profile</h3>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div>
                        <label className={`block text-lg font-bold mb-3 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>👤 Username</label>
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
                        }`}>✉️ Email</label>
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
                        💾 Save Changes
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
                  }`}>📝 Your Posts</h3>
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
                
                {userPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-8xl mb-6">📝</div>
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
                        ✨ Create Your First Post
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
                              <span>❤️ {post.reactions?.length || 0}</span>
                              <span>💬 0</span>
                            </div>
                          </div>
                        </Link>
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