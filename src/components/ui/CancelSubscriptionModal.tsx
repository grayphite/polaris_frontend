import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { cancelSubscription } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess: (isImmediate: boolean) => void;
}

const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { subscription, refreshSubscription } = useAuth();
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'period_end' | 'immediate'>('period_end');

  const handleConfirm = async () => {
    setIsCancelling(true);
    try {
      const cancelAtPeriodEnd = selectedOption === 'period_end';
      const response = await cancelSubscription(teamId, cancelAtPeriodEnd);
      
      // Update subscription status from cancel response
      if (subscription && response.subscription) {
        const updatedSubscription = {
          ...subscription,
          status: response.subscription.status as 'trialing' | 'active' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'canceled' | 'unpaid',
          current_period_end: response.subscription.current_period_end,
          cancel_at_period_end: response.subscription.cancel_at_period_end,
          canceled_at: response.subscription.canceled_at,
        };
        refreshSubscription([updatedSubscription]);
      }

      // showSuccessToast(t('billing.success.cancelled'));
      const isImmediate = !cancelAtPeriodEnd;
      onSuccess(isImmediate);
      onClose();

    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('billing.errors.cancelFailed');
      showErrorToast(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={!isCancelling ? onClose : undefined} />
      <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-xl mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('billing.cancelModal.title')}</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">{t('billing.cancelModal.message')}</p>
          
          <div className="space-y-3">
            <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="radio"
                name="cancelOption"
                value="period_end"
                checked={selectedOption === 'period_end'}
                onChange={() => setSelectedOption('period_end')}
                disabled={isCancelling}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{t('billing.cancelModal.cancelAtEnd')}</div>
                <div className="text-sm text-gray-600 mt-1">{t('billing.cancelModal.cancelAtEndDescription')}</div>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
              <input
                type="radio"
                name="cancelOption"
                value="immediate"
                checked={selectedOption === 'immediate'}
                onChange={() => setSelectedOption('immediate')}
                disabled={isCancelling}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{t('billing.cancelModal.cancelImmediately')}</div>
                <div className="text-sm text-gray-600 mt-1">{t('billing.cancelModal.warning')}</div>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCancelling}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              isLoading={isCancelling}
            >
              {isCancelling ? t('billing.cancelling') : t('billing.confirmCancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;

