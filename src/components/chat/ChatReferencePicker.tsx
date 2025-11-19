import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useChats, Chat } from '../../context/ChatContext';

type ChatReference = Pick<Chat, 'id' | 'title' | 'details'>;

interface ChatReferencePickerProps {
  projectId?: string;
  isOpen: boolean;
  anchorRect: DOMRect | null;
  placement?: 'above' | 'below';
  excludeChatId?: string;
  selectedChatIds?: string[];
  searchTerm?: string;
  onSelect: (chat: ChatReference) => void;
  onClose: () => void;
}

const fallbackContainer = typeof document !== 'undefined' ? document.body : null;

const ChatReferencePicker: React.FC<ChatReferencePickerProps> = ({
  projectId,
  isOpen,
  anchorRect,
  placement = 'below',
  excludeChatId,
  selectedChatIds = [],
  searchTerm = '',
  onSelect,
  onClose,
}) => {
  const { chatsByProject } = useChats();
  const [localSearch, setLocalSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLocalSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm !== undefined) {
      setLocalSearch(searchTerm);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }

    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  const chats = useMemo(() => {
    if (!projectId) return [];
    const list = (chatsByProject[projectId] || []).filter(chat => chat.id !== excludeChatId);
    if (!localSearch.trim()) return list;
    const searchLower = localSearch.toLowerCase();
    return list.filter((chat) => {
      return (
        chat.title.toLowerCase().includes(searchLower) ||
        (chat.details || '').toLowerCase().includes(searchLower)
      );
    });
  }, [projectId, chatsByProject, localSearch, excludeChatId]);

  if (!isOpen || !fallbackContainer) {
    return null;
  }

  const desiredLeft = anchorRect ? anchorRect.left + window.scrollX : window.scrollX + 200;
  const minLeft = window.scrollX + 16;
  const maxLeft = window.scrollX + window.innerWidth - 16 - 288; // 288px = w-72
  const left = Math.min(Math.max(desiredLeft, minLeft), Math.max(minLeft, maxLeft));

  const top = anchorRect
    ? placement === 'above'
      ? anchorRect.top + window.scrollY - 8
      : anchorRect.bottom + window.scrollY + 8
    : window.scrollY + 200;

  const transform = placement === 'above' ? 'translateY(-100%)' : undefined;

  return createPortal(
    <div
      ref={containerRef}
      className="absolute z-50 w-72 max-h-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
      style={{ top, left, transform }}
    >
      <div className="p-2 border-b border-gray-100">
        <input
          autoFocus
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search chats"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No chats found</div>
        ) : (
          chats.map((chat) => {
            const isSelected = selectedChatIds.includes(chat.id);
            return (
              <button
                key={chat.id}
                type="button"
                className={`relative flex w-full items-start gap-3 border-b border-gray-50 px-3 py-2 text-left hover:bg-light-100 ${
                  isSelected ? 'bg-primary-50' : ''
                }`}
                onClick={() => onSelect({ id: chat.id, title: chat.title, details: chat.details })}
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 line-clamp-1">{chat.title}</span>
                  {chat.details && (
                    <span className="text-xs text-gray-500 line-clamp-2">{chat.details}</span>
                  )}
                </div>
                {isSelected && (
                  <svg className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>,
    fallbackContainer
  );
};

export type ChatReferenceOption = ChatReference;
export default ChatReferencePicker;

