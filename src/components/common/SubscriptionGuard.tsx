import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SubscriptionBlockModal from '../ui/SubscriptionBlockModal';
import Loader from './Loader';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { user, subscription, isLoading } = useAuth();

  // Wait for auth to finish loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // If user is null but we're authenticated, wait (shouldn't happen but handle gracefully)
  if (!user) {
    return null;
  }

  // No subscription or empty array - redirect owners to subscription page (without MainLayout)
  if (!subscription) {
    if (user.role !== 'owner') {
      return (
        <SubscriptionBlockModal subscription={null} viewerRole={user.role} />
      );
    }
    return <Navigate to="/subscription" replace />;
  }

  // Valid subscription statuses - allow access
  if (subscription.status === 'trialing' || subscription.status === 'active') {
    return <>{children}</>;
  }

  // Invalid subscription status - block with modal
  return (
    <>
      <SubscriptionBlockModal subscription={subscription} viewerRole={user.role} />
    </>
  );
};

export default SubscriptionGuard;

