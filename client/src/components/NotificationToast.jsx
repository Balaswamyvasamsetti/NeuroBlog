import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

function NotificationToast() {
  const [notifications, setNotifications] = useState([]);
  const { isDark } = useTheme();

  useEffect(() => {
    // Welcome notification
    const welcomeNotification = {
      id: Date.now(),
      type: 'success',
      title: 'Welcome to NeuroBlog! 🎉',
      message: 'Discover AI-powered blogging at its finest',
      duration: 5000
    };
    
    setNotifications([welcomeNotification]);
    
    // Auto remove after duration
    setTimeout(() => {
      setNotifications([]);
    }, 5000);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`p-4 rounded-xl shadow-lg backdrop-blur-xl border max-w-sm ${
              isDark 
                ? 'bg-gray-800/90 border-white/10 text-white' 
                : 'bg-white/90 border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-xs mt-1 opacity-80">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default NotificationToast;