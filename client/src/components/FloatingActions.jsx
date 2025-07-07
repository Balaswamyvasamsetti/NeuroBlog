import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('📍 Scrolled to top');
  };

  const shareApp = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'NeuroBlog',
        text: 'Check out this amazing AI-powered blogging platform!',
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success('🔗 Link copied to clipboard');
    }
  };

  const actions = [
    { icon: '📤', label: 'Share', action: shareApp, color: 'bg-blue-500' },
    { icon: '💡', label: 'Feedback', action: () => toast.success('💡 Feedback feature coming soon!'), color: 'bg-yellow-500' },
    { icon: '❤️', label: 'Like', action: () => toast.success('❤️ Thanks for your support!'), color: 'bg-red-500' }
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end space-y-3">
      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900'
            }`}
          >
            ⬆️
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Actions */}
      <AnimatePresence>
        {isExpanded && actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            transition={{ delay: index * 0.1 }}
            onClick={action.action}
            className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg hover:scale-110 transition-all duration-300`}
            title={action.label}
          >
            {action.icon}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Main Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${
          isExpanded 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white text-xl`}
      >
        {isExpanded ? '✕' : '✨'}
      </motion.button>
    </div>
  );
}

export default FloatingActions;