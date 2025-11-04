import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Button from './Button';
import Select from './Select';
import { updateProjectMemberRole } from '../../services/projectMemberService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

interface EditProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  memberUserId: number;
  currentRole: string;
  memberName: string;
  onSuccess: () => void;
}

const EditProjectMemberModal: React.FC<EditProjectMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  memberUserId,
  currentRole,
  memberName,
  onSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole as 'owner' | 'editor' | 'viewer');
      setError('');
    }
  }, [isOpen, currentRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentRole === 'owner') {
      setError('Cannot change project owner role');
      return;
    }

    if (selectedRole === currentRole) {
      onClose();
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await updateProjectMemberRole(projectId, memberUserId, selectedRole);
      showSuccessToast('Member role updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to update member role';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
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
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit Member Role</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Update role for <span className="font-medium">{memberName}</span>
              </p>
            </div>

            <div>
              <Select
                id="role"
                label="Role"
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as 'owner' | 'editor' | 'viewer')}
                options={[
                  { value: 'editor', label: 'Editor' },
                  { value: 'viewer', label: 'Viewer' },
                  { value: 'owner', label: 'Owner' },
                ]}
                placeholder="Select a role"
                disabled={currentRole === 'owner'}
                required
              />
              {currentRole === 'owner' && (
                <p className="mt-1 text-sm text-gray-500">Project owner role cannot be changed</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditProjectMemberModal;

