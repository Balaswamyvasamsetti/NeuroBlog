import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function FollowButton({ userId, initialFollowing = false, size = 'md', className = '' }) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    if (currentUser && userId) {
      checkFollowStatus();
    }
  }, [currentUser, userId]);

  const checkFollowStatus = async () => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const following = response.data.following || [];
      setIsFollowing(following.some(f => f._id === userId || f === userId));
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error('Please login to follow users');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `/api/auth/follow/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      setIsFollowing(response.data.isFollowing);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.id === userId) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleFollow}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-1 ${
        isFollowing
          ? 'bg-gray-500 hover:bg-gray-600 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <>
          <span>{isFollowing ? '✓' : '+'}</span>
          <span>{isFollowing ? 'Following' : 'Follow'}</span>
        </>
      )}
    </motion.button>
  );
}

export default FollowButton;