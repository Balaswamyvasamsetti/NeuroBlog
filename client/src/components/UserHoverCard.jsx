import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

function UserHoverCard({ userId, username, children, position = 'bottom' }) {
  const [showCard, setShowCard] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { user: currentUser } = useContext(AuthContext);
  const { isDark } = useTheme();

  useEffect(() => {
    if (showCard && userId && !userInfo) {
      fetchUserInfo();
    }
  }, [showCard, userId]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`/api/auth/user/${userId}`);
      setUserInfo(response.data);
      
      if (currentUser && response.data.followers) {
        setIsFollowing(response.data.followers.some(follower => 
          follower._id === currentUser.id || follower._id === currentUser._id
        ));
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      setUserInfo(prev => ({
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

  if (!userId || userId === currentUser?.id) {
    return children;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowCard(true)}
      onMouseLeave={() => setShowCard(false)}
    >
      {children}
      
      <AnimatePresence>
        {showCard && userInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            className={`absolute z-50 w-80 p-6 rounded-2xl border backdrop-blur-xl shadow-2xl ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            } ${
              isDark 
                ? 'bg-gray-800/90 border-white/20' 
                : 'bg-white/90 border-gray-200'
            }`}
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            {/* Arrow */}
            <div className={`absolute w-3 h-3 rotate-45 ${
              position === 'top' ? 'top-full -mt-1.5' : 'bottom-full -mb-1.5'
            } left-1/2 -translate-x-1/2 ${
              isDark ? 'bg-gray-800 border-r border-b border-white/20' : 'bg-white border-r border-b border-gray-200'
            }`}></div>
            
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {username?.[0]?.toUpperCase() || 'U'}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <Link 
                  to={`/user/${userId}`}
                  className={`text-lg font-bold hover:underline block ${
                    isDark ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                  }`}
                >
                  {username}
                </Link>
                
                <p className={`text-sm mb-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {userInfo.email}
                </p>
                
                {/* Stats */}
                <div className="flex space-x-4 text-sm mb-4">
                  <div className="text-center">
                    <div className={`font-bold ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {userInfo.followersCount || 0}
                    </div>
                    <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      Followers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {userInfo.followingCount || 0}
                    </div>
                    <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      Following
                    </div>
                  </div>
                </div>
                
                {/* Follow Button */}
                {currentUser && (
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                        isFollowing
                          ? isDark
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {followLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                      ) : (
                        isFollowing ? 'Following' : 'Follow'
                      )}
                    </motion.button>
                    
                    <Link
                      to={`/user/${userId}`}
                      className={`px-4 py-2 rounded-lg font-medium transition-all text-sm border ${
                        isDark 
                          ? 'border-white/20 hover:bg-white/10 text-white' 
                          : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      Profile
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserHoverCard;