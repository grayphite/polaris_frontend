import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useChats } from '../../context/ChatContext';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: (chatId: string) => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [newChatName, setNewChatName] = useState('');
  const [newChatDetails, setNewChatDetails] = useState('');
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);
  
  const { createChat } = useChats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newChatName.trim();
    const description = newChatDetails.trim();
    if (!name) return;
    
    setIsSubmittingChat(true);
    try {
      const chatId = await createChat(projectId, name, description);
      onSuccess?.(chatId);
      handleClose();
    } catch {
      // Error handling is done in the context
    } finally {
      setIsSubmittingChat(false);
    }
  };

  const handleClose = () => {
    setNewChatName('');
    setNewChatDetails('');
    setIsSubmittingChat(false);
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
        className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Create Chat</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chat name</label>
          <input
            type="text"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="e.g. Brainstorm Q4 ideas"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            autoFocus
          />
          {/* Details field commented out - not needed for instant chat creation
          <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Details</label>
          <textarea
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Brief context for this chat..."
            rows={4}
            value={newChatDetails}
            onChange={(e) => setNewChatDetails(e.target.value)}
            required
          />
          */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-primary-600 hover:bg-primary-700 text-white"
              disabled={isSubmittingChat || !newChatName.trim()}
            >
              {isSubmittingChat ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateChatModal;
