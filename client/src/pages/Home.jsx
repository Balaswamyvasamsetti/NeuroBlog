import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import UserHoverCard from '../components/UserHoverCard';
import FollowButton from '../components/FollowButton';
import FilterSidebar from '../components/FilterSidebar';
import MobileFilterSidebar from '../components/MobileFilterSidebar';
import FilterBar from '../components/FilterBar';
import QuickFilters from '../components/QuickFilters';
import { useTheme } from '../context/ThemeContext';

function Home() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    tags: [],
    dateRange: '',
    sortBy: 'newest',
    readingTime: '',
    authorType: ''
  });
  const [tempFilters, setTempFilters] = useState({
    category: '',
    tags: [],
    dateRange: '',
    sortBy: 'newest',
    readingTime: '',
    authorType: ''
  });
  const { isDark } = useTheme();
  const location = useLocation();

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        ...filters,
        tags: filters.tags.join(',')
      });
      
      const response = await axios.get(`/api/posts?${params}`);
      setPosts(response.data.posts || response.data);
      setTotalPages(response.data.pages || 1);
      setTotalResults(response.data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to fetch posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const urlParams = new URLSearchParams(location.search);
    const search = urlParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [location, filters]);

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  const resetTempFilters = () => {
    setTempFilters({
      category: '',
      tags: [],
      dateRange: '',
      sortBy: 'newest',
      readingTime: '',
      authorType: ''
    });
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = posts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts);
    }
  }, [posts, searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    window.history.replaceState({}, '', '/');
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

  if (error) {
    return (
      <div className={`text-center p-8 ${
        isDark ? 'text-red-400' : 'text-red-600'
      }`}>
        <p>{error}</p>
        <button 
          onClick={() => fetchPosts()} 
          className={`mt-4 px-4 py-2 rounded transition-colors ${
            isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex">
        {/* Desktop Filter Sidebar - Show only when showFilters is true */}
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ 
            x: showFilters ? 0 : -320,
            opacity: showFilters ? 1 : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="hidden lg:block"
        >
          {showFilters && (
            <FilterSidebar 
              filters={tempFilters}
              onFiltersChange={setTempFilters}
              onClose={() => setShowFilters(false)}
              onApply={applyFilters}
              onReset={resetTempFilters}
            />
          )}
        </motion.div>
        
        {/* Mobile Filter Sidebar */}
        <MobileFilterSidebar 
          filters={tempFilters}
          onFiltersChange={setTempFilters}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
          onApply={applyFilters}
          onReset={resetTempFilters}
        />
      
        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Filter Toggle Button - All Screens */}
          <div className="fixed top-24 left-4 z-30">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-full shadow-lg border transition-all duration-300 ease-out ${
              showFilters
                ? 'bg-blue-600 text-white border-blue-500 shadow-xl'
                : isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </motion.button>
        </div>
        
        {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 opacity-10 ${
          isDark ? 'bg-blue-600' : 'bg-blue-400'
        }`}></div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center py-20 px-6"
        >
          <h1 className="text-7xl font-sf font-black mb-6">
            <span className={`${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>Neuro</span>
            <span className={`${
              isDark ? 'text-pink-400' : 'text-pink-600'
            }`}>Blog</span>
          </h1>
          <p className={`text-xl mb-8 font-poppins max-w-2xl mx-auto leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Experience the future of blogging with AI assistance and real-time collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link 
              to="/create" 
              className={`px-8 py-4 rounded-2xl font-sf font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              ✨ Create Your Story
            </Link>

          </div>
        </motion.div>
        
        {/* Live Search Bar */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 -mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search posts by title, content, or tags..."
              className={`w-full p-4 rounded-2xl backdrop-blur-xl border transition-all font-sf text-lg shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/20 ${
                isDark 
                  ? 'bg-gray-900/80 border-white/20 text-white placeholder-gray-400 focus:border-blue-400' 
                  : 'bg-white/80 border-gray-200/50 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ✕
              </button>
            )}
          </motion.div>
          {searchQuery && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-2 text-center text-sm font-poppins ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} found for "{searchQuery}"
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Posts Grid */}
      <div className="px-6 pb-20 mt-16">
        {/* Quick Filters */}
        <QuickFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        {/* Filter Bar */}
        <FilterBar 
          filters={filters}
          onFiltersChange={setFilters}
          totalResults={totalResults}
        />
        {filteredPosts.length === 0 && !searchQuery ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6 neuro-float">🚀</div>
            <h3 className={`text-3xl font-sf font-bold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>No Stories Yet</h3>
            <p className={`mb-8 font-poppins ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Be the pioneer and create the first amazing story!</p>
            <Link 
              to="/create" 
              className={`px-8 py-4 rounded-2xl font-sf font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              🎨 Create First Post
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="neuro-hover"
                >
                  <Link to={`/post/${post._id}`} className="block h-full">
                    <div className={`p-8 h-full relative overflow-hidden group rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col ${
                      isDark 
                        ? 'bg-gray-800/50 border-white/10 hover:bg-gray-800/70' 
                        : 'bg-white/70 border-gray-200/50 hover:bg-white/90'
                    }`}>
                      {/* Theme-based Overlay */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${
                        isDark ? 'bg-blue-500' : 'bg-blue-600'
                      }`}></div>
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <h2 className={`text-2xl font-sf font-bold transition-all duration-300 flex-1 ${
                            isDark 
                              ? 'text-white group-hover:text-blue-400' 
                              : 'text-gray-900 group-hover:text-blue-600'
                          }`}>
                            {post.title}
                          </h2>
                          <div className={`ml-3 px-2 py-1 rounded-lg text-xs font-bold ${
                            isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                          }`}>
                            #{index + 1 + (currentPage - 1) * 9}
                          </div>
                        </div>
                        
                        <p className={`mb-6 font-poppins leading-relaxed line-clamp-3 flex-grow ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {post.summary || (post.body && post.body.substring(0, 120)) || 'Discover this amazing story...'}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index % 5 === 0 ? 'bg-blue-600' :
                              index % 5 === 1 ? 'bg-pink-600' :
                              index % 5 === 2 ? 'bg-cyan-600' :
                              index % 5 === 3 ? 'bg-green-600' : 'bg-purple-600'
                            }`}>
                              {post.author?.username?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <UserHoverCard 
                                userId={post.author?._id} 
                                username={post.author?.username}
                              >
                                <Link 
                                  to={`/user/${post.author?._id}`}
                                  className={`font-sf font-medium hover:underline ${
                                    isDark ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {post.author?.username || 'Anonymous'}
                                </Link>
                              </UserHoverCard>
                              <p className={`text-sm font-mono ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                          <FollowButton userId={post.author?._id} size="sm" />
                        </div>
                        
                        {post.category && (
                          <div className="mb-4">
                            <span className={`inline-block px-3 py-1 text-xs font-sf font-semibold rounded-full backdrop-blur-sm ${
                              isDark 
                                ? 'bg-white/10 text-white' 
                                : 'bg-gray-900/10 text-gray-900'
                            }`}>
                              {post.category.name}
                            </span>
                          </div>
                        )}
                        
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span key={tagIndex} className={`inline-block px-2 py-1 text-xs font-mono rounded-lg ${
                                isDark 
                                  ? 'bg-white/5 text-gray-300' 
                                  : 'bg-gray-900/5 text-gray-600'
                              }`}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className={`flex items-center justify-between mt-6 pt-4 border-t ${
                          isDark ? 'border-white/10' : 'border-gray-200'
                        }`}>
                          <div className={`flex items-center space-x-4 text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <span className="flex items-center space-x-1">
                              <span>❤️</span>
                              <span>{post.reactions?.length || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>💬</span>
                              <span>{post.commentCount || 0}</span>
                            </span>
                          </div>
                          <div className={`text-xs font-mono ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {post.status === 'published' ? '🟢 Live' : '🟡 Draft'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          
            {totalPages > 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center items-center space-x-4 mt-16"
              >
                <button
                  onClick={() => fetchPosts(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-6 py-3 rounded-xl font-sf font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  ← Previous
                </button>
                <div className={`px-6 py-3 rounded-xl backdrop-blur-xl border ${
                  isDark 
                    ? 'bg-gray-800/50 border-white/10' 
                    : 'bg-white/70 border-gray-200/50'
                }`}>
                  <span className={`font-sf font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentPage} of {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => fetchPosts(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-3 rounded-xl font-sf font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Next →
                </button>
              </motion.div>
            )}
          </>
        )}
        
        {/* No search results */}
        {searchQuery && filteredPosts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h3 className={`text-2xl font-sf font-bold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>No Results Found</h3>
            <p className={`mb-8 font-poppins ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>No posts match your search for "{searchQuery}"</p>
            <button
              onClick={clearSearch}
              className={`px-8 py-4 rounded-2xl font-sf font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              🔄 Clear Search
            </button>
          </motion.div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default Home;