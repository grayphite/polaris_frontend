import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InvitationStatusModalProps {
  open: boolean;
  status: 'declined' | 'cancelled' | 'expired';
  onAcknowledge?: () => void;
  details?: {
    message?: string;
    expires_at?: string;
    invited_at?: string;
  };
}

const InvitationStatusModal: React.FC<InvitationStatusModalProps> = ({
  open,
  status,
  onAcknowledge,
  details,
}) => {
  const getStatusContent = () => {
    switch (status) {
      case 'declined':
        return {
          title: 'Invitation Declined',
          message: 'This invitation was declined and can no longer be used.',
          icon: (
            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'cancelled':
        return {
          title: 'Invitation Cancelled',
          message: 'This invitation was cancelled by the sender.',
          icon: (
            <svg className="h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
      case 'expired':
        return {
          title: 'Invitation Expired',
          message: 'This invitation has expired.',
          icon: (
            <svg className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const content = getStatusContent();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop - non-dismissible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  {content.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {content.title}
                </h3>

                {/* Message */}
                <p className="text-gray-600 mb-6">
                  {content.message}
                </p>

                {/* Optional details */}
                {details?.message && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Message:</span> {details.message}
                    </p>
                  </div>
                )}

                {/* Button */}
                <button
                  onClick={onAcknowledge || (() => window.location.href = '/login')}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                >
                  Return to Login
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvitationStatusModal;

