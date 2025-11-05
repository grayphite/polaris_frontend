import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { showErrorToast } from '../../utils/toast';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validation
    if (!email) {
      setError(t('validation.emailRequired'));
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('validation.emailInvalid'));
      return;
    }
    
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      showErrorToast(t('errors.forgotPasswordFailed', { tryAgain: t('common.errors.tryAgain') }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{t('auth.forgotPassword.title')}</h2>
        <p className="mt-2 text-gray-600">
          {isSubmitted 
            ? t('auth.forgotPassword.subtitleSuccess')
            : t('auth.forgotPassword.subtitle')}
        </p>
      </div>
      
      {isSubmitted ? (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {t('auth.forgotPassword.sentTo')} <span className="font-medium">{email}</span>
          </p>
          <p className="text-sm text-gray-500">
            {t('auth.forgotPassword.didntReceive')}{' '}
            <button 
              onClick={() => setIsSubmitted(false)}
              className="text-primary-600 hover:text-primary-500"
            >
              {t('auth.forgotPassword.tryAgain')}
            </button>
          </p>
          <div className="mt-6">
            <Link to="/login">
              <Button variant="outline" fullWidth>
                {t('auth.forgotPassword.backToLogin')}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t('common.form.emailAddress')}
            type="email"
            placeholder={t('auth.forgotPassword.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            }
            autoComplete="email"
          />
          
          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              {t('auth.forgotPassword.submitButton')}
            </Button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default ForgotPassword;

