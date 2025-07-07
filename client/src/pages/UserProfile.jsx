import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/api/auth/user/${userId}`);
      setUser(response.data);
      
      // Check if current user is following this user
      if (currentUser && response.data.followers) {
        setIsFollowing(response.data.followers.some(follower => 
          follower._id === currentUser.id || follower._id === currentUser._id
        ));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await axios.get(`/api/posts?author=${userId}`);
      setUserPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Please login to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      const response = await axios.post(
        `/api/auth/follow/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      setIsFollowing(response.data.isFollowing);
      
      // Update follower count
      setUser(prev => ({
        ...prev,
        followersCount: response.data.isFollowing 
          ? prev.followersCount + 1 
          : prev.followersCount - 1
      }));
      
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setFollowLoading(false);
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className={`text-2xl font-bold mb-4 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>User not found</h2>
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
        {/* User Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-8 border backdrop-blur-xl mb-8 ${
            isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white/80 border-gray-200'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-2xl">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className={`text-3xl font-bold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {user.username}
              </h1>
              
              <p className={`text-lg mb-4 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {user.email}
              </p>
              
              {/* Follow Stats */}
              <div className="flex justify-center md:justify-start space-x-8 mb-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {userPosts.length}
                  </div>
                  <div className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Posts
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {user.followersCount || 0}
                  </div>
                  <div className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Followers
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {user.followingCount || 0}
                  </div>
                  <div className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Following
                  </div>
                </div>
              </div>
              
              {/* Follow Button */}
              {currentUser && currentUser.id !== userId && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-8 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 ${
                    isFollowing
                      ? isDark
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {followLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>{isFollowing ? '👥' : '➕'}</span>
                      <span>{isFollowing ? 'Following' : 'Follow'}</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* User Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-8 border backdrop-blur-xl ${
            isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white/80 border-gray-200'
          }`}
        >
          <h2 className={`text-2xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Posts by {user.username}
          </h2>
          
          {userPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className={`text-lg ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No posts yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Link to={`/post/${post._id}`} className="block h-full">
                    <div className={`p-6 h-full rounded-xl border transition-all hover:shadow-lg ${
                      isDark 
                        ? 'bg-gray-700/30 border-white/10 hover:bg-gray-700/50' 
                        : 'bg-white/70 border-gray-200 hover:bg-white'
                    }`}>
                      <h3 className={`text-xl font-bold mb-3 line-clamp-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {post.title}
                      </h3>
                      
                      <p className={`mb-4 line-clamp-3 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {post.summary || post.body?.substring(0, 120) + '...'}
                      </p>
                      
                      <div className={`flex items-center justify-between text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <span>❤️</span>
                            <span>{post.reactions?.length || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>💬</span>
                            <span>{post.commentCount || 0}</span>
                          </span>
                        </div>
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
  );
}

export default UserProfile;