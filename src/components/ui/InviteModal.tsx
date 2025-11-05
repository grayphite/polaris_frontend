import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Button from './Button';
import { useAuth } from '../../context/AuthContext';
import { useInvitations } from '../../context/InvitationsContext';
import { createTeam, createTeamInvitation } from '../../services/teamService';
import { showSuccessToast } from '../../utils/toast';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { invitationCount } = useInvitations();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let teamId = localStorage.getItem('teamId');

      if (!teamId) {
        const firstName = user?.firstName;
        if (!firstName) {
          setError(t('inviteModal.missingFirstName'));
          setIsSubmitting(false);
          return;
        }

        const team = await createTeam({
          name: `${firstName} Team`,
          description: 'Default team description',
        });
        teamId = String(team.id);
        localStorage.setItem('teamId', teamId);
      }

      await createTeamInvitation(Number(teamId), { invited_email: email });
      showSuccessToast(t('inviteModal.invitationSent'));
      setEmail('');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      const errorMessage = errorData?.error || errorData?.message;

      if (status === 409 || status === 400) {
        if (
          errorMessage?.includes('already registered') ||
          errorMessage?.includes('already a member') ||
          errorMessage?.includes('pending invitation already exists')
        ) {
          setError(t('inviteModal.emailAlreadyRegistered'));
        } else if (errorMessage?.includes('Invalid email format')) {
          setError(t('inviteModal.invalidEmailFormat'));
        } else if (errorMessage?.includes('required')) {
          setError(t('inviteModal.emailRequired'));
        } else {
          setError(errorMessage || t('inviteModal.inviteFailed', { tryAgain: t('common.errors.tryAgain') }));
        }
      } else {
        setError(errorMessage || t('inviteModal.inviteFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('inviteModal.title')}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {invitationCount >= 2 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  {t('inviteModal.additionalUserWarning')}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('common.form.emailAddress')}
              </label>
              <input
                type="email"
                id="email"
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('inviteModal.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {t('inviteModal.invitationMessage')}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!email}
              isLoading={isSubmitting}
            >
              {t('inviteModal.sendInvite')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default InviteModal;

