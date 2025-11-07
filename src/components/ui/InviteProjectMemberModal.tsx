import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Button from './Button';
import Select from './Select';
import { listTeamMembers } from '../../services/teamService';
import { addProjectMember } from '../../services/projectMemberService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import Loader from '../common/Loader';

interface InviteProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingMemberUserIds: number[];
  onSuccess: () => void;
}

const InviteProjectMemberModal: React.FC<InviteProjectMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  existingMemberUserIds,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [teamMembers, setTeamMembers] = useState<Array<{ id: number; username: string; email: string; firstName: string; lastName: string }>>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTeamMembers();
      setSelectedUserId('');
      setSelectedRole('editor');
      setError('');
    }
  }, [isOpen]);

  const loadTeamMembers = async () => {
    const teamId = localStorage.getItem('teamId');
    if (!teamId) {
      setError(t('projectMember.noTeamFound'));
      return;
    }

    setIsLoadingMembers(true);
    try {
      const response = await listTeamMembers(teamId);
      const availableMembers = response.members.filter(
        (member) => !existingMemberUserIds.includes(member.user_id)
      );
      setTeamMembers(availableMembers.map((m) => ({
        id: m.user_id,
        username: m.user.username,
        email: m.user.email,
        firstName: m.user.first_name,
        lastName: m.user.last_name,
      })));
    } catch (err: any) {
      setError(err?.response?.data?.error || t('projectMember.loadMembersFailed'));
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setError('');
    setIsSubmitting(true);

    try {
      await addProjectMember(projectId, selectedUserId as number, selectedRole);
      showSuccessToast(t('projectMember.memberAdded'));
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || t('projectMember.addFailed');
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setSelectedRole('editor');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-lg shadow-xl max-w-xl w-full mx-4"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('projectMember.inviteTitle')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('projectMember.teamMemberLabel')}
              </label>
              {isLoadingMembers ? (
                <div className="relative">
                  <div className="block w-full rounded-md shadow-sm py-2 pl-4 pr-10 border border-gray-300 bg-gray-50 flex items-center">
                    <Loader size="sm" color="gray" className="mr-3" />
                    <span className="text-sm text-gray-500">{t('projectMember.loadingMembers')}</span>
                  </div>
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">{t('projectMember.noAvailableMembers')}</p>
              ) : (
                <Select
                  id="member"
                  value={selectedUserId}
                  onChange={(value) => setSelectedUserId(value as number)}
                  options={teamMembers.map((member) => ({
                    value: member.id,
                    label: `${member.firstName} ${member.lastName} (${member.email})`,
                  }))}
                  placeholder={t('projectMember.selectTeamMember')}
                  required
                />
              )}
            </div>

            <div>
              <Select
                id="role"
                label={t('common.role')}
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as 'owner' | 'editor' | 'viewer')}
                options={[
                  { value: 'editor', label: t('projects.detail.members.roles.editor') },
                  { value: 'viewer', label: t('projects.detail.members.roles.viewer') },
                ]}
                placeholder={t('projectMember.selectTeamMember')}
                disabled={isLoadingMembers || !selectedUserId}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedUserId || isLoadingMembers || teamMembers.length === 0}
              isLoading={isSubmitting}
            >
              {t('projectMember.addMember')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default InviteProjectMemberModal;

