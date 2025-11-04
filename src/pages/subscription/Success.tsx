import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getSubscriptionStatus } from '../../services/paymentService';
import { TeamSubscription } from '../../services/authService';
import Loader from '../../components/common/Loader';
import { showErrorToast } from '../../utils/toast';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSubscription } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);

  // Refresh subscription data after successful payment
  useEffect(() => {
    const refreshSubscriptionData = async () => {
      try {
        const teamId = localStorage.getItem('teamId');
        
        if (!teamId) {
          console.error('Team ID not found');
          showErrorToast('Unable to get team information. Please try logging in again.');
          setIsRefreshing(false);
          return;
        }

        // Fetch updated subscription from backend
        const response = await getSubscriptionStatus(teamId);
        
        if (response.subscription) {
          // Convert single subscription object to array format expected by refreshSubscription
          const subscriptionArray: TeamSubscription[] = [{
            id: response.subscription.id,
            status: response.subscription.status as TeamSubscription['status'],
            trial_end: response.subscription.trial_end || null,
            current_period_start: response.subscription.current_period_start,
            current_period_end: response.subscription.current_period_end,
            quantity: response.subscription.quantity,
            plan: {
              id: response.subscription.plan.id,
              code: response.subscription.plan.code,
              display_name: response.subscription.plan.display_name,
              max_team_members_per_team: response.subscription.plan.max_team_members_per_team,
            },
            price: {
              id: response.subscription.price.id,
              nickname: response.subscription.price.nickname,
              amount_cents: response.subscription.price.amount_cents,
              currency: response.subscription.price.currency,
              trial_days: response.subscription.price.trial_days,
              per_seat_amount_cents: response.subscription.price.per_seat_amount_cents,
            },
            billing_user_id: response.subscription.billing_user_id,
          }];

          // Update subscription in AuthContext and localStorage
          refreshSubscription(subscriptionArray);
        }
      } catch (error) {
        console.error('Failed to refresh subscription:', error);
        showErrorToast('Failed to refresh subscription data. You may need to refresh the page.');
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshSubscriptionData();
  }, [refreshSubscription]);

  if (isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-10 w-10 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Subscription Successful!
          </h2>
          <p className="text-gray-600 mb-2">
            Thank you for subscribing to Polaris.
          </p>
          <p className="text-gray-600 mb-8">
            Your subscription is now active and you can start using all the features.
          </p>

          {/* Trial Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">
              Your free trial has started! You won't be charged until the trial period ends.
            </p>
          </div>

          {/* Action Button */}
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => navigate('/projects')}
          >
            Go to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Success;

