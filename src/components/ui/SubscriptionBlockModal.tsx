import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TeamSubscription } from '../../services/authService';
import Button from './Button';
import SubscriptionLayout from '../../layouts/SubscriptionLayout';

interface SubscriptionBlockModalProps {
  subscription: TeamSubscription | null;
  viewerRole: string;
  onRenew?: () => void;
  useStandaloneLayout?: boolean;
}

type SubscriptionStatus = TeamSubscription['status'] | 'unknown';

const SubscriptionBlockModal: React.FC<SubscriptionBlockModalProps> = ({
  subscription,
  viewerRole,
  onRenew,
  useStandaloneLayout = true,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const storedUser = React.useMemo(() => {
    try {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);
  const fullName = React.useMemo(() => {
    if (!storedUser) return '';
    const names = [storedUser.firstName || storedUser.first_name, storedUser.lastName || storedUser.last_name].filter(Boolean);
    return names.length > 0 ? names.join(' ') : storedUser.username || '';
  }, [storedUser]);
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

  const getStatusContent = (status: SubscriptionStatus) => {
    switch (status) {
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

  const status: SubscriptionStatus = subscription?.status ?? 'unknown';
  const content = getStatusContent(status);
  const statusLabel = t(`subscriptionBlock.status.${status}`, {
    defaultValue: t('subscriptionBlock.status.unknown'),
  });
  const isOwnerView = viewerRole === 'owner';
  
  // Get member-specific message based on status
  const getMemberMessage = () => {
    if (status === 'canceled') {
      return t('subscriptionBlock.memberCanceled');
    }
    return t('subscriptionBlock.memberBlocked', { status: statusLabel });
  };
  
  const memberMessage = isOwnerView ? null : getMemberMessage();

  const handleRenewClick = () => {
    if (onRenew) {
      onRenew();
      return;
    }

    navigate('/subscription', {
      state: { showRenewOverlay: true },
    });
  };

  const modalCard = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-lg bg-white p-8 shadow-xl"
    >
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          {content.icon}
        </div>

        <h3 className="mb-0 text-2xl font-bold text-gray-900">
          {content.title}
        </h3>
        {subscription?.plan &&<p className="mb-4 text-lg font-semibold text-gray-900">{subscription.plan.display_name}</p>}

        {(fullName || storedUser?.email) && (
          <div className="mb-4 rounded-lg bg-gray-50 p-4 text-left">
            <p className="mb-1 text-sm font-medium text-gray-700">
              {t('subscriptionBlock.accountHolderLabel', { defaultValue: 'Account holder' })}
            </p>
            {fullName && <p className="text-lg font-semibold text-gray-900">{fullName}</p>}
            {storedUser?.email && <p className="mt-1 text-sm text-gray-600">{storedUser.email}</p>}
          </div>
        )}

        {subscription && isOwnerView && (
          <div className="mb-4 rounded-lg bg-gray-50 p-4 text-left">
            {subscription?.trial_end && (
              <div className="mb-2">
                <p className="mb-1 text-sm font-medium text-gray-700">{t('subscriptionBlock.trialEndDate')}</p>
                <p className="text-sm text-gray-900">{formatDate(subscription.trial_end)}</p>
              </div>
            )}
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">{t('subscriptionBlock.currentPeriodEnd')}</p>
              <p className="text-sm text-gray-900">{formatDate(subscription.current_period_end)}</p>
            </div>
          </div>
        )}

        <div className="mb-6 text-gray-600">
          <p>{isOwnerView ? content.message : memberMessage}</p>
        </div>

        <div className="mt-6 space-y-3">
          {subscription?.status === 'canceled' && isOwnerView && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleRenewClick}
            >
              {t('subscriptionBlock.canceled.renewButton')}
            </Button>
          )}
          {subscription?.status === 'incomplete' && isOwnerView && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleRenewClick}
            >
              {t('subscriptionBlock.incomplete.completeButton')}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (!useStandaloneLayout) {
    return (
      <div className="fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto bg-gray-900/80 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-full items-center justify-center">
          <div className="w-full max-w-lg">
            {modalCard}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionLayout centered background="dim" contentClassName="w-full max-w-lg">
      <div className="w-full">
        {modalCard}
      </div>
    </SubscriptionLayout>
  );
};

export default SubscriptionBlockModal;

