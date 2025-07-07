import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function FuturisticMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/', color: 'blue' },
    { icon: '✨', label: 'Create', path: '/create', color: 'purple', auth: true },
    { icon: '👤', label: 'Profile', path: '/profile', color: 'green', auth: true },
    { icon: '🔍', label: 'Search', path: '/search', color: 'yellow' },
    { icon: '⚙️', label: 'Admin', path: '/admin', color: 'red', admin: true },
  ];

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* Floating Menu Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-2 sm:top-4 right-2 sm:right-4 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-xl border-2 transition-all duration-300 touch-friendly xs-device sm-device ${
          isOpen
            ? 'bg-red-500/20 border-red-500/50 text-red-400'
            : isDark
              ? 'bg-gray-800/80 border-white/20 text-white hover:border-blue-500/50'
              : 'bg-white/80 border-gray-300/50 text-gray-900 hover:border-blue-500/50'
        }`}
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          {isOpen ? '✕' : '☰'}
        </div>
      </motion.button>

      {/* Futuristic Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              className={`fixed top-2 sm:top-4 right-2 sm:right-4 z-50 w-72 sm:w-80 rounded-xl sm:rounded-2xl backdrop-blur-xl border shadow-2xl xs-device sm-device md-device touch-friendly ${
                isDark 
                  ? 'bg-gray-900/90 border-white/10' 
                  : 'bg-white/90 border-gray-200/50'
              }`}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold">N</span>
                  </div>
                  <div>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      NeuroBlog
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Next-Gen Platform
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-4 border-b border-gray-200/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {user.username}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="p-4 space-y-2">
                {menuItems.map((item, index) => {
                  // Check permissions
                  if (item.auth && !user) return null;
                  if (item.admin && user?.role !== 'admin') return null;

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all hover:scale-105 ${
                          isDark 
                            ? 'hover:bg-white/10 text-gray-300 hover:text-white' 
                            : 'hover:bg-gray-100/50 text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${item.color}-500/20`}>
                          <span className="text-lg">{item.icon}</span>
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Theme Toggle */}
              <div className="p-4 border-t border-gray-200/10">
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsOpen(false);
                  }}
                  className={`flex items-center space-x-3 p-3 rounded-xl w-full transition-all hover:scale-105 ${
                    isDark 
                      ? 'hover:bg-white/10 text-gray-300 hover:text-white' 
                      : 'hover:bg-gray-100/50 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
                  </div>
                  <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              {/* Auth Actions */}
              <div className="p-4 border-t border-gray-200/10">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 p-3 rounded-xl w-full transition-all hover:scale-105 bg-red-500/10 hover:bg-red-500/20 text-red-500"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <span className="text-lg">🚪</span>
                    </div>
                    <span className="font-medium">Logout</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-xl w-full transition-all hover:scale-105 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <span className="text-lg">🔐</span>
                    </div>
                    <span className="font-medium">Login</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default FuturisticMenu;