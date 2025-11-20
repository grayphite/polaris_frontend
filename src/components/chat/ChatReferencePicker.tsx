import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useChats, Chat } from '../../context/ChatContext';
import { refreshChatSummary, fetchChats } from '../../services/chatService';

type ChatReference = Pick<Chat, 'id' | 'title' | 'details'>;

interface ChatReferencePickerProps {
  projectId?: string;
  isOpen: boolean;
  anchorRect: DOMRect | null;
  placement?: 'above' | 'below';
  excludeChatId?: string;
  selectedChats?: ChatReference[];
  searchTerm?: string;
  onSelectionChange: (selected: ChatReference[]) => void;
  onClose: () => void;
}

const fallbackContainer = typeof document !== 'undefined' ? document.body : null;

const ChatReferencePicker: React.FC<ChatReferencePickerProps> = ({
  projectId,
  isOpen,
  anchorRect,
  placement = 'below',
  excludeChatId,
  selectedChats = [],
  searchTerm = '',
  onSelectionChange,
  onClose,
}) => {
  const { chatsByProject } = useChats();
  const [localSearch, setLocalSearch] = useState('');
  const [localSelection, setLocalSelection] = useState<ChatReference[]>(selectedChats);
  const [refreshingIds, setRefreshingIds] = useState<Record<string, boolean>>({});
  const [searchResults, setSearchResults] = useState<ChatReference[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalSelection(selectedChats);
  }, [selectedChats]);

  useEffect(() => {
    if (!isOpen) {
      setLocalSearch('');
      setDebouncedSearch('');
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm !== undefined) {
      setLocalSearch(searchTerm);
    }
  }, [searchTerm]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(localSearch.trim());
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearch]);

  // Server-side search when debounced search term changes
  useEffect(() => {
    if (!isOpen || !projectId) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Only search if there's a search term
    if (!debouncedSearch) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const performSearch = async () => {
      try {
        const response = await fetchChats(projectId, 1, 50, debouncedSearch);
        if (cancelled) return;

        if (response && response.chats) {
          const mappedChats: ChatReference[] = response.chats
            .filter(chat => chat.id.toString() !== excludeChatId)
            .map(chat => ({
              id: chat.id.toString(),
              title: chat.name,
              details: chat.description,
            }));
          setSearchResults(mappedChats);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Failed to search chats:', error);
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [projectId, debouncedSearch, isOpen, excludeChatId]);

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

  const selectedIds = useMemo(() => new Set(localSelection.map(chat => chat.id)), [localSelection]);

  // Get available chats: use search results when searching, otherwise use initial 4 chats from context
  const availableChats = useMemo(() => {
    if (!projectId) return [];
    
    // When searching, use server-side search results
    if (debouncedSearch && searchResults.length > 0) {
      // Filter out already selected chats from search results
      return searchResults.filter(chat => !selectedIds.has(chat.id));
    }
    
    // When not searching, use initial 4 chats from context
    const initialChats = (chatsByProject[projectId] || [])
      .filter(chat => chat.id !== excludeChatId)
      .map(chat => ({
        id: chat.id,
        title: chat.title,
        details: chat.details || '',
      }));
    
    // Filter out already selected chats
    return initialChats.filter(chat => !selectedIds.has(chat.id));
  }, [projectId, chatsByProject, debouncedSearch, searchResults, excludeChatId, selectedIds]);

  if (!isOpen || !fallbackContainer) {
    return null;
  }

  const toggleChat = (chat: ChatReference) => {
    setLocalSelection((prev) => {
      const exists = prev.some((ref) => ref.id === chat.id);
      const nextSelection = exists ? prev.filter((ref) => ref.id !== chat.id) : [...prev, chat];
      onSelectionChange(nextSelection);
      return nextSelection;
    });
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, chat: ChatReference) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleChat(chat);
    }
  };

  const handleRefreshClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    chatId: string
  ) => {
    event.stopPropagation();
    event.preventDefault();

    const idKey = chatId.toString();
    if (refreshingIds[idKey]) return;

    setRefreshingIds((prev) => ({ ...prev, [idKey]: true }));

    try {
      await refreshChatSummary(idKey);
    } catch (error) {
      console.error('Failed to refresh chat summary:', error);
    } finally {
      setRefreshingIds((prev) => {
        const next = { ...prev };
        delete next[idKey];
        return next;
      });
    }
  };

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
        {/* Selected chats display at the top */}
        {localSelection.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="px-1 text-xs font-medium text-gray-500">Added</div>
            {localSelection.map((chat) => {
              const idKey = chat.id.toString();
              const isRefreshing = Boolean(refreshingIds[idKey]);
              return (
                <div
                  key={chat.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-primary-50 hover:bg-primary-100"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-900 truncate block">{chat.title}</span>
                    {chat.details && (
                      <span className="text-xs text-gray-500 truncate block">{chat.details}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className={`rounded-full p-0.5 text-gray-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                        isRefreshing ? 'cursor-wait text-primary-600' : ''
                      }`}
                      onClick={(event) => handleRefreshClick(event, idKey)}
                      disabled={isRefreshing}
                      aria-label="Refresh chat summary"
                    >
                      {isRefreshing ? (
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.25" />
                          <path d="M4 12a8 8 0 018-8" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.055 11H5a7 7 0 0112.95-2.5H16a1 1 0 000 2h4a1 1 0 001-1V5a1 1 0 10-2 0v1.519A9 9 0 003 11zm17.89 2H19a7 7 0 01-12.95 2.5H8a1 1 0 000-2H4a1 1 0 00-1 1V19a1 1 0 102 0v-1.519A9 9 0 0020.945 13z" />
                        </svg>
                      )}
                    </button>
                    <svg className="h-3.5 w-3.5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChat(chat);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                      aria-label="Remove reference"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
            <hr className="my-1 border-gray-200" />
          </div>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : availableChats.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            {debouncedSearch ? 'No chats found' : 'No chats available'}
          </div>
        ) : (
          availableChats.map((chat) => {
            const idKey = chat.id.toString();
            const isRefreshing = Boolean(refreshingIds[idKey]);
            return (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                className="relative flex w-full items-start gap-3 border-b border-gray-50 px-3 py-2 text-left hover:bg-gray-50"
                onClick={() => toggleChat({ id: chat.id, title: chat.title, details: chat.details })}
                onKeyDown={(event) => handleRowKeyDown(event, { id: chat.id, title: chat.title, details: chat.details })}
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 line-clamp-1">{chat.title}</span>
                  {chat.details && (
                    <span className="text-xs text-gray-500 line-clamp-2">{chat.details}</span>
                  )}
                </div>
              </div>
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

