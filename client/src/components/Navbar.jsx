import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`rounded-2xl px-3 sm:px-6 py-3 sm:py-4 backdrop-blur-xl border transition-all duration-300 ${
          isDark 
            ? 'bg-gray-900/80 border-white/10 shadow-2xl' 
            : 'bg-white/80 border-gray-200/50 shadow-xl'
        }`}>
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${
                isDark ? 'bg-blue-600' : 'bg-blue-600'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"></path>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"></path>
                </svg>
              </div>
              <span className={`text-lg sm:text-2xl font-sf font-black transition-all duration-300 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                NeuroBlog
              </span>
            </Link>
            
            <div className="hidden lg:flex items-center space-x-1">
              <NavLink to="/" icon="🏠" text="Home" isDark={isDark} />
              <NavLink to="/create" icon="✨" text="Create" isDark={isDark} />
              <NavLink to="/profile" icon="👤" text="Profile" isDark={isDark} />
              {user && user.role === 'admin' && (
                <NavLink to="/admin" icon="⚙️" text="Admin" isDark={isDark} />
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Voice Control Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  // Trigger voice control - we'll implement this
                  const voiceEvent = new CustomEvent('toggleVoiceControl');
                  window.dispatchEvent(voiceEvent);
                }}
                className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' 
                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-600'
                }`}
                title="Voice Control"
              >
                <span className="text-lg sm:text-xl">🎤</span>
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                data-theme-toggle
                className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' 
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-600'
                }`}
              >
                <span className="text-lg sm:text-xl">{isDark ? '☀️' : '🌙'}</span>
              </motion.button>

              {/* Mobile Menu Button */}
              <button 
                data-mobile-menu
                className={`lg:hidden p-2 sm:p-3 rounded-xl transition-colors ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                    : 'bg-gray-900/10 hover:bg-gray-900/20 text-gray-900'
                }`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="text-lg sm:text-xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
              </button>
            </div>
            
            <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`hidden md:flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl backdrop-blur-sm ${
                    isDark 
                      ? 'bg-gray-800/50 border border-white/10' 
                      : 'bg-gray-100/50 border border-gray-200'
                  }`}>
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-pink-600' : 'bg-pink-600'
                    }`}>
                      <span className="text-white font-bold text-xs sm:text-sm">{user.username?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className={`font-sf font-medium text-sm ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>{user.username}</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout} 
                    className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-xl font-sf font-medium transition-all duration-300 shadow-lg text-sm"
                  >
                    <span className="hidden sm:inline">🚪 Logout</span>
                    <span className="sm:hidden">🚪</span>
                  </motion.button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-sf font-semibold transition-all duration-300 shadow-lg text-sm sm:text-base ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <span className="hidden sm:inline">🚀 Get Started</span>
                  <span className="sm:hidden">🚀</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`lg:hidden mt-4 rounded-2xl backdrop-blur-xl border overflow-hidden ${
                isDark 
                  ? 'bg-gray-900/90 border-white/10' 
                  : 'bg-white/90 border-gray-200/50'
              }`}
            >
              <div className="p-4 space-y-2">
                <MobileNavLink to="/" icon="🏠" text="Home" isDark={isDark} onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/create" icon="✨" text="Create" isDark={isDark} onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/profile" icon="👤" text="Profile" isDark={isDark} onClick={() => setIsMobileMenuOpen(false)} />
                {user && user.role === 'admin' && (
                  <MobileNavLink to="/admin" icon="⚙️" text="Admin" isDark={isDark} onClick={() => setIsMobileMenuOpen(false)} />
                )}
                <div className={`border-t pt-2 mt-2 ${
                  isDark ? 'border-white/10' : 'border-gray-200'
                }`}>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      isDark 
                        ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
                    <span className="font-sf font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  
                  {user && (
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        isDark 
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                          : 'text-red-600 hover:text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <span className="text-xl">🚪</span>
                      <span className="font-sf font-medium">Logout</span>
                    </button>
                  )}
                  
                  {!user && (
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        isDark 
                          ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10' 
                          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <span className="text-xl">🚀</span>
                      <span className="font-sf font-medium">Login</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

// NavLink component for consistent styling
function NavLink({ to, icon, text, isDark }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-sf font-medium group ${
        isDark 
          ? 'text-gray-300 hover:text-white hover:bg-white/10' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span>{text}</span>
    </Link>
  );
}

// Mobile NavLink component
function MobileNavLink({ to, icon, text, isDark, onClick }) {
  return (
    <Link 
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-sf font-medium ${
        isDark 
          ? 'text-gray-300 hover:text-white hover:bg-white/10' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{text}</span>
    </Link>
  );
}

export default Navbar;