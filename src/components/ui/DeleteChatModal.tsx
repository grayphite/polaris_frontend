import React from 'react';

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  chatId: string;
  onConfirm: (projectId: string, chatId: string) => Promise<void>;
}

const DeleteChatModal: React.FC<DeleteChatModalProps> = ({
  isOpen,
  onClose,
  projectId,
  chatId,
  onConfirm,
}) => {
  const handleConfirm = async () => {
    await onConfirm(projectId, chatId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Delete Chat</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">Are you sure you want to delete this chat? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteChatModal;

