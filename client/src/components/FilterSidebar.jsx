import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

function FilterSidebar({ filters, onFiltersChange, onClose, onApply, onReset }) {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState([]);
  const [popularTags, setPopularTags] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchPopularTags();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const response = await axios.get('/api/posts/popular-tags');
      setPopularTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onReset();
  };

  return (
    <div className={`w-80 flex-shrink-0 ${
      isDark ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-white to-gray-50'
    } border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} h-screen sticky top-0 overflow-y-auto shadow-xl`}>
      <div className="p-6 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-2xl ${
            isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'
          }`}>
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Smart Filters
            </h3>
          </div>
          <div className="flex space-x-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
              }`}
            >
              🗑️ Clear
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
              }`}
            >
              ✕
            </motion.button>
          </div>
          
          {/* Apply Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={onApply}
            className={`w-full mt-4 px-6 py-3 rounded-xl font-bold text-lg transition-all shadow-lg ${
              isDark 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            }`}
          >
            ✨ Apply Filters
          </motion.button>
        </motion.div>

        {/* Categories */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-5 rounded-2xl ${
            isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white border border-gray-200'
          } shadow-lg`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
              </svg>
            </div>
            <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Categories
            </h4>
          </div>
          <div className="space-y-3">
            {[{ _id: '', name: 'All Categories' }, ...categories].map(category => (
              <motion.label 
                key={category._id} 
                whileHover={{ x: 5 }}
                className={`flex items-center space-x-3 cursor-pointer p-3 rounded-xl transition-all ${
                  filters.category === category._id 
                    ? isDark ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-purple-100 border border-purple-200'
                    : isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={category._id}
                  checked={filters.category === category._id}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-5 h-5 text-purple-600"
                />
                <span className={`font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {category.name}
                </span>
              </motion.label>
            ))}
          </div>
        </motion.div>

        {/* Tags */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-5 rounded-2xl ${
            isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white border border-gray-200'
          } shadow-lg`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Popular Tags
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => {
                  const newTags = filters.tags.includes(tag)
                    ? filters.tags.filter(t => t !== tag)
                    : [...filters.tags, tag];
                  handleFilterChange('tags', newTags);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md ${
                  filters.tags.includes(tag)
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                    : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                }`}
              >
                #{tag}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Sort & Date */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 gap-6"
        >
          {/* Sort By */}
          <div className={`p-5 rounded-2xl ${
            isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white border border-gray-200'
          } shadow-lg`}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>
              <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Sort By
              </h4>
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className={`w-full p-4 rounded-xl border-2 font-medium transition-all focus:ring-4 focus:ring-blue-500/20 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              }`}
            >
              <option value="newest">🆕 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
              <option value="popular">❤️ Most Popular</option>
              <option value="trending">🔥 Trending Now</option>
            </select>
          </div>

          {/* Date Range */}
          <div className={`p-5 rounded-2xl ${
            isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white border border-gray-200'
          } shadow-lg`}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Time Range
              </h4>
            </div>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className={`w-full p-4 rounded-xl border-2 font-medium transition-all focus:ring-4 focus:ring-orange-500/20 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
              }`}
            >
              <option value="">🌍 All Time</option>
              <option value="today">📅 Today</option>
              <option value="week">📊 This Week</option>
              <option value="month">📆 This Month</option>
              <option value="year">🗓️ This Year</option>
            </select>
          </div>
        </motion.div>

        {/* Active Filters Summary */}
        {(filters.category || filters.tags.length > 0 || filters.dateRange || filters.sortBy !== 'newest') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-5 rounded-2xl ${
              isDark ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
            } shadow-lg`}
          >
            <h4 className={`font-bold text-lg mb-3 flex items-center space-x-2 ${
              isDark ? 'text-blue-300' : 'text-blue-700'
            }`}>
              <span>✨</span>
              <span>Active Filters</span>
            </h4>
            <div className="space-y-2">
              {filters.category && (
                <div className={`flex items-center justify-between p-2 rounded-lg ${
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    📂 {categories.find(c => c._id === filters.category)?.name || 'Category'}
                  </span>
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className={`text-xs hover:scale-110 transition-transform ${isDark ? 'text-blue-300' : 'text-blue-700'}`}
                  >
                    ✕
                  </button>
                </div>
              )}
              {filters.tags.map(tag => (
                <div key={tag} className={`flex items-center justify-between p-2 rounded-lg ${
                  isDark ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <span className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    🏷️ #{tag}
                  </span>
                  <button
                    onClick={() => handleFilterChange('tags', filters.tags.filter(t => t !== tag))}
                    className={`text-xs hover:scale-110 transition-transform ${isDark ? 'text-green-300' : 'text-green-700'}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default FilterSidebar;