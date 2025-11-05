import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChats } from '../../context/ChatContext';

interface EditChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  chatId: string;
  initialTitle: string;
  initialDetails?: string;
}

const EditChatModal: React.FC<EditChatModalProps> = ({
  isOpen,
  onClose,
  projectId,
  chatId,
  initialTitle,
  initialDetails = '',
}) => {
  const { t } = useTranslation();
  const [chatEditTitle, setChatEditTitle] = useState(initialTitle);
  const [chatEditDetails, setChatEditDetails] = useState(initialDetails);
  
  const { updateChat } = useChats();

  // Update local state when props change
  useEffect(() => {
    setChatEditTitle(initialTitle);
    setChatEditDetails(initialDetails);
  }, [initialTitle, initialDetails, isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = chatEditTitle.trim();
    if (!name) return;
    updateChat(projectId, chatId, name, chatEditDetails.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-xl mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{t('chat.editModal.title')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('common.close')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('chat.editModal.titleLabel')}</label>
          <input
            type="text"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={chatEditTitle}
            onChange={(e) => setChatEditTitle(e.target.value)}
            autoFocus
          />
          <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">{t('chat.editModal.detailsLabel')}</label>
          <textarea
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none max-h-40 overflow-y-auto scrollbar-thin"
            placeholder={t('chat.editModal.detailsPlaceholder')}
            rows={4}
            value={chatEditDetails}
            onChange={(e) => setChatEditDetails(e.target.value)}
            maxLength={300}
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-primary-600 hover:bg-primary-700 text-white"
              disabled={!chatEditTitle.trim()}
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditChatModal;

