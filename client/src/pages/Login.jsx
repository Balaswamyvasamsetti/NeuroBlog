import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const { login, register } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className={`absolute top-20 left-20 w-32 h-32 rounded-full opacity-20 animate-pulse ${
          isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-400 to-purple-400'
        }`}></div>
        <div className={`absolute top-40 right-32 w-24 h-24 rounded-full opacity-30 animate-pulse ${
          isDark ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-gradient-to-r from-pink-400 to-red-400'
        }`} style={{animationDelay: '2s'}}></div>
        <div className={`absolute bottom-32 left-32 w-40 h-40 rounded-full opacity-15 animate-pulse ${
          isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-cyan-400 to-blue-400'
        }`} style={{animationDelay: '4s'}}></div>
        <div className={`absolute bottom-20 right-20 w-28 h-28 rounded-full opacity-25 animate-pulse ${
          isDark ? 'bg-gradient-to-r from-green-500 to-cyan-500' : 'bg-gradient-to-r from-green-400 to-cyan-400'
        }`} style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="mb-8"
            >
              <h1 className="text-7xl font-sf font-black mb-4">
                <span className={`${
                  isDark 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400' 
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'
                }`}>Neuro</span>
                <span className={`${
                  isDark 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-400' 
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-600'
                }`}>Blog</span>
              </h1>
              <div className={`w-20 h-1 mx-auto rounded-full mb-4 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }`}></div>
              <p className={`text-lg font-poppins ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>AI-Powered Blogging Experience</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className={`p-10 relative overflow-hidden rounded-2xl backdrop-blur-xl border shadow-2xl ${
              isDark 
                ? 'bg-gray-900/80 border-white/10' 
                : 'bg-white/80 border-gray-200/50'
            }`}
          >
            {/* Floating particles */}
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full opacity-60 animate-pulse ${
              isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-400 to-purple-400'
            }`}></div>
            <div className={`absolute bottom-6 left-6 w-3 h-3 rounded-full opacity-40 animate-pulse ${
              isDark ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-gradient-to-r from-pink-400 to-red-400'
            }`} style={{animationDelay: '3s'}}></div>
            
            <div className={`flex mb-8 p-1 rounded-xl backdrop-blur-sm ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
            }`}>
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-6 rounded-xl font-sf font-semibold transition-all duration-300 ${
                  isLogin 
                    ? isDark 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-6 rounded-xl font-sf font-semibold transition-all duration-300 ${
                  !isLogin 
                    ? isDark 
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg transform scale-105' 
                      : 'bg-gradient-to-r from-pink-600 to-red-600 text-white shadow-lg transform scale-105'
                    : isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0, scale: 0.9 }}
                  animate={{ height: 'auto', opacity: 1, scale: 1 }}
                  exit={{ height: 0, opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      placeholder="Choose your username"
                      value={formData.username}
                      onChange={handleChange}
                      required={!isLogin}
                      className={`w-full px-4 py-3 rounded-xl font-sf transition-all focus:outline-none focus:ring-2 ${
                        isDark 
                          ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20' 
                          : 'bg-gray-100/50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      👤
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl font-sf transition-all focus:outline-none focus:ring-2 ${
                    isDark 
                      ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20' 
                      : 'bg-gray-100/50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  ✉️
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl font-sf transition-all focus:outline-none focus:ring-2 ${
                    isDark 
                      ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20' 
                      : 'bg-gray-100/50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  🔒
                </div>
              </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 border rounded-lg text-sm ${
                  isDark 
                    ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                    : 'bg-red-100 border-red-300 text-red-700'
                }`}
              >
                {error}
              </motion.div>
            )}

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full py-4 font-sf font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 rounded-xl transition-all duration-300 shadow-xl ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {loading ? (
                  <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${
                    isDark ? 'border-white' : 'border-white'
                  }`}></div>
                ) : (
                  <>
                    <span>{isLogin ? '🚀 Sign In' : '✨ Create Account'}</span>
                  </>
                )}
              </motion.button>
          </form>

            <div className="mt-8 text-center">
              <Link 
                to="/" 
                className={`inline-flex items-center space-x-2 transition-colors font-sf ${
                  isDark 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>←</span>
                <span>Back to Home</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`text-center text-sm font-poppins ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <p className="flex items-center justify-center space-x-2">
              <span>🧠</span>
              <span>Powered by Balaswamy</span>
              <span>✨</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;