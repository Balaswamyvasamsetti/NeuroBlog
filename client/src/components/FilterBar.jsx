import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

function FilterBar({ filters, onFiltersChange, totalResults }) {
  const { isDark } = useTheme();

  const hasActiveFilters = filters.category || filters.tags.length > 0 || filters.dateRange || filters.sortBy !== 'newest' || filters.readingTime || filters.authorType;

  const removeFilter = (type, value = null) => {
    switch (type) {
      case 'category':
        onFiltersChange({ ...filters, category: '' });
        break;
      case 'tag':
        onFiltersChange({ ...filters, tags: filters.tags.filter(tag => tag !== value) });
        break;
      case 'dateRange':
        onFiltersChange({ ...filters, dateRange: '' });
        break;
      case 'sortBy':
        onFiltersChange({ ...filters, sortBy: 'newest' });
        break;
      case 'readingTime':
        onFiltersChange({ ...filters, readingTime: '' });
        break;
      case 'authorType':
        onFiltersChange({ ...filters, authorType: '' });
        break;
      case 'all':
        onFiltersChange({ category: '', tags: [], dateRange: '', sortBy: 'newest', readingTime: '', authorType: '' });
        break;
    }
  };

  if (!hasActiveFilters) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border mb-6 ${
        isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white/70 border-gray-200'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {totalResults} results found
        </span>
        
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
              }`}
            >
              <span>📂 Category</span>
              <button
                onClick={() => removeFilter('category')}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                ✕
              </button>
            </motion.div>
          )}
          
          {filters.tags.map(tag => (
            <motion.div
              key={tag}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
              }`}
            >
              <span>#{tag}</span>
              <button
                onClick={() => removeFilter('tag', tag)}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                ✕
              </button>
            </motion.div>
          ))}
          
          {filters.dateRange && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
              }`}
            >
              <span>📅 {filters.dateRange}</span>
              <button
                onClick={() => removeFilter('dateRange')}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                ✕
              </button>
            </motion.div>
          )}
          
          {filters.sortBy !== 'newest' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
              }`}
            >
              <span>🔄 {filters.sortBy}</span>
              <button
                onClick={() => removeFilter('sortBy')}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                ✕
              </button>
            </motion.div>
          )}
          
          {filters.readingTime && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              <span>⏱️ {filters.readingTime}</span>
              <button
                onClick={() => removeFilter('readingTime')}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                ✕
              </button>
            </motion.div>
          )}
          
          {filters.authorType && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-700'
              }`}
            >
              <span>👤 {filters.authorType}</span>
              <button
                onClick={() => removeFilter('authorType')}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                ✕
              </button>
            </motion.div>
          )}
        </div>
        
        <button
          onClick={() => removeFilter('all')}
          className={`text-sm px-3 py-1 rounded-lg transition-colors ${
            isDark 
              ? 'text-red-400 hover:bg-red-500/20' 
              : 'text-red-600 hover:bg-red-100'
          }`}
        >
          Clear All
        </button>
      </div>
    </motion.div>
  );
}

export default FilterBar;