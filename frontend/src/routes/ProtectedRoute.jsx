/**
 * Protected Route
 * Redirects unauthenticated users to the login page
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show spinner while checking stored auth token
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <Loading size="lg" text="Loading CareerPilot..." />
      </div>
    );
  }

  // Redirect to login, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
