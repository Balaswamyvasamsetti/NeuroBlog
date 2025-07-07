import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

function RelatedPosts({ currentPost }) {
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchRelatedPosts();
  }, [currentPost]);

  const fetchRelatedPosts = async () => {
    try {
      const response = await axios.get('/api/posts?limit=6');
      const posts = response.data.posts || response.data;
      
      // Filter out current post and get related ones
      const filtered = posts
        .filter(post => post._id !== currentPost._id)
        .slice(0, 3);
      
      setRelatedPosts(filtered);
    } catch (error) {
      console.error('Error fetching related posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl p-6 border backdrop-blur-xl ${
      isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white/70 border-gray-200'
    }`}>
      <h3 className={`text-xl font-sf font-bold mb-6 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>Related Posts</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {relatedPosts.map((post, index) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="group"
          >
            <Link to={`/post/${post._id}`} className="block">
              <div className={`p-4 h-full rounded-xl border transition-all hover:shadow-lg ${
                isDark 
                  ? 'bg-gray-700/30 border-white/10 hover:bg-gray-700/50' 
                  : 'bg-gray-100/50 border-gray-200 hover:bg-white hover:border-gray-300'
              }`}>
                <h4 className={`font-sf font-semibold mb-2 transition-all line-clamp-2 ${
                  isDark 
                    ? 'text-white group-hover:text-blue-400' 
                    : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  {post.title}
                </h4>
                <p className={`text-sm mb-3 line-clamp-3 font-poppins ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {post.summary || (post.body && post.body.substring(0, 100)) || 'Read more...'}
                </p>
                <div className={`flex items-center justify-between text-xs ${
                  isDark ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  <span>By {post.author?.username}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default RelatedPosts;