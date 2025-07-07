import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const { isDark } = useTheme();
  
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full`}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`mt-4 text-sm font-medium ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}
      >
        {text}
      </motion.p>
    </div>
  );
}

export default LoadingSpinner;