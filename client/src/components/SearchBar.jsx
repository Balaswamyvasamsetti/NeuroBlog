import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.length > 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/posts/search/${encodeURIComponent(query)}`);
      setResults(response.data.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleResultClick = (postId) => {
    navigate(`/post/${postId}`);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full"
      >
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="🔍 Search amazing stories..."
            className="w-full p-4 bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all font-sf text-lg shadow-2xl"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </form>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="absolute top-16 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl max-h-96 overflow-y-auto"
          >
            <form onSubmit={handleSubmit} className="relative mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="🔍 Search amazing stories..."
                className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all font-sf"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </form>

            {results.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs text-gray-400 font-sf mb-2">Search Results:</p>
                {results.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleResultClick(post._id)}
                    className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl cursor-pointer transition-all group"
                  >
                    <h4 className="text-white font-sf font-semibold text-sm mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {post.title}
                    </h4>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2 font-poppins">
                      {post.summary || (post.body && post.body.substring(0, 80)) || 'Discover this story...'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>By {post.author?.username}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {query.length > 2 && results.length === 0 && !isSearching && (
              <div className="text-center py-4 text-gray-400 text-sm font-poppins">
                No posts found for "{query}"
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 font-poppins">
                Press Enter to search all posts
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default SearchBar;