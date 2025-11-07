import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';
import { showErrorToast } from '../../utils/toast';

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Check if we're on an auth page
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname) 
    || location.pathname.startsWith('/invitation/setup-account');
  
  useEffect(() => {
    if (isAuthenticated && location.pathname.startsWith('/invitation/setup-account')) {
      showErrorToast("You're already logged in. Please logout first to access this invitation link.");
    }
  }, [isAuthenticated, location.pathname]);
  
  // Don't show full-screen loader on auth pages when user is not authenticated
  // The form buttons will show their own loading state during login attempts
  // Only show loader during initial auth check (when user might be authenticated)
  if (isLoading && !(isAuthPage && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }
  
  return <>{children}</>;
};

export default GuestRoute;

