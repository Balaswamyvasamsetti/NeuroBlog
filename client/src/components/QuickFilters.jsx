import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

function QuickFilters({ filters, onFiltersChange }) {
  const { isDark } = useTheme();

  const quickFilters = [
    { label: '🔥 Trending', key: 'sortBy', value: 'trending' },
    { label: '❤️ Popular', key: 'sortBy', value: 'popular' },
    { label: '📅 Today', key: 'dateRange', value: 'today' },
    { label: '📊 This Week', key: 'dateRange', value: 'week' },
    { label: '⚡ Quick Read', key: 'readingTime', value: 'quick' },
    { label: '📚 Long Read', key: 'readingTime', value: 'long' },
    { label: '🏷️ AI', key: 'tags', value: 'ai' },
    { label: '🔐 Security', key: 'tags', value: 'security' },
    { label: '☁️ Cloud', key: 'tags', value: 'cloud' },
    { label: '📱 Mobile', key: 'tags', value: 'mobile' },
    { label: '⚛️ React', key: 'tags', value: 'react' },
    { label: '🟢 Node.js', key: 'tags', value: 'nodejs' },
    { label: '🐍 Python', key: 'tags', value: 'python' },
    { label: '💾 Database', key: 'tags', value: 'database' }
  ];

  const handleQuickFilter = (key, value) => {
    if (key === 'tags') {
      const newTags = filters.tags.includes(value)
        ? filters.tags.filter(tag => tag !== value)
        : [...filters.tags, value];
      onFiltersChange({ ...filters, tags: newTags });
    } else {
      const newValue = filters[key] === value ? (key === 'sortBy' ? 'newest' : '') : value;
      onFiltersChange({ ...filters, [key]: newValue });
    }
  };

  const isActive = (key, value) => {
    if (key === 'tags') {
      return filters.tags.includes(value);
    }
    return filters[key] === value;
  };

  return (
    <div className="mb-8">
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        ⚡ Quick Filters
      </h3>
      <div className="flex flex-wrap gap-3">
        {quickFilters.map((filter, index) => (
          <motion.button
            key={`${filter.key}-${filter.value}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickFilter(filter.key, filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl ${
              isActive(filter.key, filter.value)
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                  : 'bg-white/70 text-gray-700 hover:bg-white border border-gray-200'
            }`}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default QuickFilters;