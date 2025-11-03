import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

interface MemberInviteConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  costCents: number;
  currency: string;
  isLoading?: boolean;
}

const MemberInviteConsentModal: React.FC<MemberInviteConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  costCents,
  currency,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const formatAmount = (cents: number, curr: string): string => {
    const amount = cents / 100;
    return `${amount.toFixed(2)} ${curr.toUpperCase()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Additional Member Charge</h3>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-700">
                You are inviting an additional user. If this user accepts the invitation, you will be charged{' '}
                <span className="font-semibold text-gray-900">{formatAmount(costCents, currency)}</span>{' '}
                from your card.
              </p>
            </div>
            
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                This charge will be applied when the invited user accepts and joins your team.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              Continue
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MemberInviteConsentModal;

