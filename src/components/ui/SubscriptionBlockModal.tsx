import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TeamSubscription } from '../../services/authService';

interface SubscriptionBlockModalProps {
  subscription: TeamSubscription;
}

const SubscriptionBlockModal: React.FC<SubscriptionBlockModalProps> = ({ subscription }) => {
  const { t } = useTranslation();
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusContent = () => {
    switch (subscription.status) {
      case 'past_due':
        return {
          title: t('subscriptionBlock.pastDue.title'),
          message: t('subscriptionBlock.pastDue.message'),
          iconColor: 'text-orange-500',
          icon: (
            <svg className="h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
      case 'incomplete':
        return {
          title: t('subscriptionBlock.incomplete.title'),
          message: t('subscriptionBlock.incomplete.message'),
          iconColor: 'text-yellow-500',
          icon: (
            <svg className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'incomplete_expired':
        return {
          title: t('subscriptionBlock.incompleteExpired.title'),
          message: t('subscriptionBlock.incompleteExpired.message'),
          iconColor: 'text-red-500',
          icon: (
            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'canceled':
        return {
          title: t('subscriptionBlock.canceled.title'),
          message: t('subscriptionBlock.canceled.message'),
          iconColor: 'text-red-500',
          icon: (
            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'unpaid':
        return {
          title: t('subscriptionBlock.unpaid.title'),
          message: t('subscriptionBlock.unpaid.message'),
          iconColor: 'text-red-500',
          icon: (
            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ),
        };
      default:
        return {
          title: t('subscriptionBlock.default.title'),
          message: t('subscriptionBlock.default.message'),
          iconColor: 'text-gray-500',
          icon: (
            <svg className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
    }
  };

  const content = getStatusContent();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        {/* Backdrop - non-dismissible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-8"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                {content.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {content.title}
              </h3>

              {/* Plan Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">{t('subscriptionBlock.plan')}</p>
                <p className="text-lg font-semibold text-gray-900">{subscription.plan.display_name}</p>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                {subscription.trial_end && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">{t('subscriptionBlock.trialEndDate')}</p>
                    <p className="text-sm text-gray-900">{formatDate(subscription.trial_end)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">{t('subscriptionBlock.currentPeriodEnd')}</p>
                  <p className="text-sm text-gray-900">{formatDate(subscription.current_period_end)}</p>
                </div>
              </div>

              {/* Status Message */}
              <p className="text-gray-600 mb-0">
                {content.message}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SubscriptionBlockModal;

