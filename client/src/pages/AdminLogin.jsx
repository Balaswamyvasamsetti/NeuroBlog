import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function AdminLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/admin-login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h1 className={`text-4xl font-bold mb-4 ${
            isDark 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400' 
              : 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600'
          }`}>
            🛡️ Admin Access
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Secure admin portal
          </p>
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-8 rounded-2xl backdrop-blur-xl border shadow-2xl ${
            isDark 
              ? 'bg-gray-900/80 border-white/10' 
              : 'bg-white/80 border-gray-200/50'
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                name="email"
                placeholder="Admin Email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                  isDark 
                    ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-red-400 focus:ring-red-400/20' 
                    : 'bg-gray-100/50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20'
                }`}
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Admin Password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                  isDark 
                    ? 'bg-gray-800/50 border border-white/10 text-white placeholder-gray-400 focus:border-red-400 focus:ring-red-400/20' 
                    : 'bg-gray-100/50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20'
                }`}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                '🛡️ Admin Login'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className={`text-sm transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ← Regular User Login
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default AdminLogin;