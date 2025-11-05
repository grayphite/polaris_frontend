import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import Button from './Button';
import { removeProjectMember } from '../../services/projectMemberService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

interface DeleteProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  memberUserId: number;
  memberName: string;
  onSuccess: () => void;
}

const DeleteProjectMemberModal: React.FC<DeleteProjectMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  memberUserId,
  memberName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await removeProjectMember(projectId, memberUserId);
      showSuccessToast(t('projectMember.memberRemoved'));
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || t('projectMember.removeFailed');
      showErrorToast(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('projectMember.removeTitle')}</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {t('projectMember.removeConfirm', { name: memberName })}
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleConfirm} isLoading={isDeleting}>
              {t('common.remove')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteProjectMemberModal;

