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
  
  useEffect(() => {
    if (isAuthenticated && location.pathname.startsWith('/invitation/setup-account')) {
      showErrorToast("You're already logged in. Please logout first to access this invitation link.");
    }
  }, [isAuthenticated, location.pathname]);
  
  if (isLoading) {
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

