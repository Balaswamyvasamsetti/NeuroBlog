import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import VoiceControl from './components/VoiceControl';
import PushSubscription from './components/PushSubscription';
import FuturisticMenu from './components/FuturisticMenu';
import FloatingActions from './components/FloatingActions';
import SearchBar from './components/SearchBar';
import FloatingActionMenu from './components/FloatingActionMenu';
import ProgressBar from './components/ProgressBar';
import NotificationToast from './components/NotificationToast';
import NeuroBot from './components/NeuroBot';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Post from './pages/Post';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';

import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import './styles.css';

// App content component that uses theme
function AppContent() {
  const { isDark } = useTheme();

  return (
    <BrowserRouter>
      <div className={`min-h-screen font-sans relative transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        <ParticleBackground />
        <div className="relative z-10">
          <Navbar />
          <ProgressBar />
          <PushSubscription />
          <VoiceControl />
          <FloatingActionMenu />
          <NotificationToast />
          <NeuroBot />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-20"
          >
            <div className="px-2 sm:px-4 md:px-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/post/:id" element={<Post />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/edit/:id" element={<EditPost />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/user/:userId" element={<UserProfile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Routes>
            </div>
          </motion.div>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              color: isDark ? '#fff' : '#1f2937',
              backdropFilter: 'blur(10px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
            }
          }}
        />
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;