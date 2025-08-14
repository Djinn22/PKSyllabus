import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, shouldReauth } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce periodic re-authentication
  if (shouldReauth()) {
    return <Navigate to="/login" state={{ from: location, reason: 'reauth' }} replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    // Redirect to home or show unauthorized message
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
