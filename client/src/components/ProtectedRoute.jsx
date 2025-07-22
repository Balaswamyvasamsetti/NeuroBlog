import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ProtectedRoute = () => {
  const { user, loading, authChecked } = useContext(AuthContext);
  const { isDark } = useTheme();
  
  // Show loading state while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Render the protected route
  return <Outlet />;
};

export default ProtectedRoute;