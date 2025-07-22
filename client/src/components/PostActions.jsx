import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';

function PostActions({ post, isDark, onPostDeleted, onPostStatusChange }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    
    try {
      await axios.delete(`/api/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Post deleted successfully');
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.error || 'Error deleting post');
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePublishStatus = async () => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    
    setIsChangingStatus(true);
    try {
      await axios.put(`/api/posts/${post._id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      if (onPostStatusChange) onPostStatusChange(post._id, newStatus);
    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error(error.response?.data?.error || 'Error updating post status');
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4 justify-end">
        {/* Edit button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to={`/edit/${post._id}`}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
              isDark 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30' 
                : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </Link>
        </motion.div>
        
        {/* Publish/Unpublish button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePublishStatus}
          disabled={isChangingStatus}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
            post.status === 'published'
              ? isDark 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30' 
                : 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200'
              : isDark 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' 
                : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
          }`}
        >
          {isChangingStatus ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <>
              {post.status === 'published' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
              <span>{post.status === 'published' ? 'Unpublish' : 'Publish'}</span>
            </>
          )}
        </motion.button>
        
        {/* Delete button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={confirmDelete}
          disabled={isDeleting}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
            isDark 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
              : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
          }`}
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </>
          )}
        </motion.button>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDark={isDark}
      />
    </>
  );
}

export default PostActions;