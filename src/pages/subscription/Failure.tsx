import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import SubscriptionLayout from '../../layouts/SubscriptionLayout';

const Failure: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <SubscriptionLayout centered contentClassName="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('subscription.failure.title')}
          </h2>
          <p className="text-gray-600 mb-8">
            {t('subscription.failure.message', { tryAgainOrContact: t('common.errors.tryAgainOrContact') })}
          </p>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => navigate('/subscription')}
          >
            {t('subscription.failure.tryAgain')}
          </Button>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              {t('subscription.failure.needHelp')}{' '}
              <a
                href="mailto:support@polaris.com"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                {t('subscription.failure.contactSupport')}
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </SubscriptionLayout>
  );
};

export default Failure;

