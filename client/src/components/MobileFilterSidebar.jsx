import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

function MobileFilterSidebar({ filters, onFiltersChange, isOpen, onToggle, onApply, onReset }) {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState([]);
  const [popularTags, setPopularTags] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchPopularTags();
    }
  }, [isOpen]);

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
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed left-0 top-0 h-full w-80 z-50 ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold flex items-center space-x-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                  </svg>
                  <span>Filters</span>
                </h3>
                <button
                  onClick={onToggle}
                  className={`p-2 rounded-lg ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={clearFilters}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isDark 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    onApply();
                    onToggle();
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isDark 
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  Apply
                </button>
              </div>

              {/* Categories */}
              <div>
                <h4 className={`font-bold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Categories
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={filters.category === ''}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="text-blue-600"
                    />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>All</span>
                  </label>
                  {categories.map(category => (
                    <label key={category._id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={category._id}
                        checked={filters.category === category._id}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="text-blue-600"
                      />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div>
                <h4 className={`font-bold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter(t => t !== tag)
                          : [...filters.tags, tag];
                        handleFilterChange('tags', newTags);
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className={`font-bold mb-2 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Sort By
                  </h4>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className={`w-full p-2 rounded-lg border text-sm ${
                      isDark 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="popular">Popular</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>
                <div>
                  <h4 className={`font-bold mb-2 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Date Range
                  </h4>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className={`w-full p-2 rounded-lg border text-sm ${
                      isDark 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileFilterSidebar;