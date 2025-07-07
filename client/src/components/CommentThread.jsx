import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

function CommentThread({ postId, comments }) {
  const { user } = useContext(AuthContext);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const handleComment = async () => {
    try {
      await axios.post(
        '/api/comments',
        { postId, content: newComment, parentId: replyTo },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpvote = async (commentId) => {
    try {
      await axios.post(
        `/api/comments/${commentId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error('Error upvoting comment:', error);
    }
  };

  const renderComments = (comments, depth = 0) => {
    return comments.map(comment => (
      <motion.div
        key={comment._id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`ml-${depth * 4} p-2 bg-gray-800 bg-opacity-50 rounded-lg mb-2`}
      >
        <p>{comment.content} - <strong>{comment.author.username}</strong></p>
        <button
          onClick={() => handleUpvote(comment._id)}
          className="text-cyan-300 hover:text-cyan-100 mr-2"
        >
          Upvote ({comment.upvotes})
        </button>
        <button
          onClick={() => setReplyTo(comment._id)}
          className="text-cyan-300 hover:text-cyan-100"
        >
          Reply
        </button>
        {comment.replies && renderComments(comment.replies, depth + 1)}
      </motion.div>
    ));
  };

  return (
    <div>
      <h3 className="text-xl text-cyan-400 mb-4">Comments</h3>
      {user && (
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-2 bg-gray-800 text-white rounded-lg glassmorphism"
          />
          <button
            onClick={handleComment}
            className="mt-2 bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600"
          >
            Post Comment
          </button>
        </div>
      )}
      {renderComments(comments)}
    </div>
  );
}

export default CommentThread;