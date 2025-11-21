import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChats } from '../../context/ChatContext';
import { useProjects } from '../../context/ProjectsContext';
import { useAuth } from '../../context/AuthContext';
import { sendMessageApi, getChatMessages, deleteChatApi, getChatReferencesMapping } from '../../services/chatService';
import ChatReferencePicker, { ChatReferenceOption } from '../../components/chat/ChatReferencePicker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Loader from '../../components/common/Loader';
import { showErrorToast } from '../../utils/toast';
import { uploadFile, deleteFile } from '../../services/fileService';
import { getPdfPageCount } from '../../utils/fileValidation';
import MarkdownMessage from '../../components/ui/MarkdownMessage';
import { formatTime } from '../../utils/dateTime';
import { downloadRagFile } from '../../utils/fileDownload';
import { getAvatarColor, getInitials } from '../../utils/avatarColor';

interface FileAttachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  file_type: string;
  type: string;
  downloadable: boolean;
  created_at: string;
  uploadStatus?: 'uploading' | 'success' | 'error';
  uploadError?: string;
}

interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  role?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  attachments?: FileAttachment[];
  file_references?: string[];
  sources?: string[];
  chat_references?: ChatReferenceOption[];
  user_info?: UserInfo;
}

type PersistedReference = {
  id: string;
  title?: string;
};

const normalizeReferenceValue = (
  entry:
    | number
    | string
    | { id?: number | string; chat_id?: number | string; name?: string; title?: string }
    | null
    | undefined
): PersistedReference | null => {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'object') {
    const idValue = entry.id ?? entry.chat_id;
    if (idValue === null || idValue === undefined) return null;
    return {
      id: idValue.toString(),
      title: entry.name || entry.title,
    };
  }
  return { id: entry.toString() };
};

const MAX_PDF_PAGES = 100;

const sortMessagesByTimestamp = (messages: Message[]) => {
  return [...messages].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    
    // Primary sort: by timestamp
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    
    // Secondary sort: user messages before assistant messages (for same timestamp)
    if (a.role === 'user' && b.role === 'assistant') return -1;
    if (a.role === 'assistant' && b.role === 'user') return 1;
    
    return 0;
  });
};

const ChatInterface: React.FC = () => {
  const { t } = useTranslation();
  const { projectId, chatId } = useParams<{ projectId: string; chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>(''); // Buffer (server data)
  const [displayedContent, setDisplayedContent] = useState<string>(''); // Animated display
  const [streamingSources, setStreamingSources] = useState<string[]>([]); // Sources during streaming
  const [isStreamingComplete, setIsStreamingComplete] = useState(false); // Track if streaming is complete
  const [chatReferences, setChatReferences] = useState<ChatReferenceOption[]>([]);
  const [persistedReferenceIds, setPersistedReferenceIds] = useState<PersistedReference[]>([]);
  const [isReferencePickerOpen, setIsReferencePickerOpen] = useState(false);
  const [pickerAnchorRect, setPickerAnchorRect] = useState<DOMRect | null>(null);
  const [inlineTrigger, setInlineTrigger] = useState<{ start: number; end: number; keyword: string } | null>(null);
  const [pickerPlacement, setPickerPlacement] = useState<'above' | 'below'>('above');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);
  const isPaginationLoadRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const referenceButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  
  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const { chatsByProject, sidebarChatsByProject, updateChat, deleteChat, ensureProjectChatsLoaded } = useChats();
  const { projects, sidebarProjects } = useProjects();
  const { user } = useAuth();
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const projectRole = useMemo(() => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId) || sidebarProjects.find(p => p.id === projectId);
    return project?.user_role ?? null;
  }, [projects, sidebarProjects, projectId]);
  const navigate = useNavigate();

  const chatsMetadataById = useMemo(() => {
    if (!projectId) return {};
    const list = chatsByProject[projectId] || [];
    return list.reduce((acc, chat) => {
      if (chat?.id) {
        acc[chat.id.toString()] = {
          title: chat.title,
          details: chat.details || '',
        };
      }
      return acc;
    }, {} as Record<string, { title: string; details: string }>);
  }, [projectId, chatsByProject]);

  const getChatMetadata = useCallback(
    (id: string | number | null | undefined) => {
      if (id === null || id === undefined) return null;
      const key = id.toString();
      return chatsMetadataById[key] || null;
    },
    [chatsMetadataById]
  );

  const buildChatReferences = (aiChat: any): ChatReferenceOption[] | undefined => {
    const detailRefs = aiChat?.chat_reference_details?.length
      ? aiChat.chat_reference_details
          .map((ref: any) => ({
            id: ref.id ? ref.id.toString() : '',
            title: ref.name || ref.title || 'Referenced chat',
            details: ref.description || ref.details || '',
          }))
          .filter((ref: { id: string }) => Boolean(ref.id)) as ChatReferenceOption[]
      : undefined;

    if (detailRefs && detailRefs.length > 0) {
      return detailRefs;
    }

    const buildFromObject = (chat: any) => {
      const chatId = chat?.id ?? chat?.chat_id;
      if (!chatId && chatId !== 0) return null;
      const meta = getChatMetadata(chatId);
      return {
        id: chatId.toString(),
        title: chat?.name || chat?.title || meta?.title || `Chat #${chatId}`,
        details: chat?.description || chat?.details || meta?.details || '',
      };
    };

    if (Array.isArray(aiChat?.referenced_chats) && aiChat.referenced_chats.length > 0) {
      const refs = aiChat.referenced_chats
        .map((chat: any) => buildFromObject(chat))
        .filter(Boolean) as ChatReferenceOption[];
      if (refs.length > 0) {
        return refs;
      }
    }

    const mapIdsToRefs = (
      ids: Array<number | string | { id?: number | string; chat_id?: number | string; name?: string; title?: string }>
    ) =>
      ids
        .map((entry) => {
          const normalized = normalizeReferenceValue(entry);
          if (!normalized) return null;
          const meta = getChatMetadata(normalized.id);
          return {
            id: normalized.id,
            title: normalized.title || meta?.title || `Chat #${normalized.id}`,
            details: meta?.details || '',
          };
        })
        .filter(Boolean) as ChatReferenceOption[];

    if (Array.isArray(aiChat?.referenced_chat) && aiChat.referenced_chat.length > 0) {
      const refs = mapIdsToRefs(aiChat.referenced_chat);
      if (refs.length > 0) {
        return refs;
      }
    }

    if (Array.isArray(aiChat?.referenced_chat_ids) && aiChat.referenced_chat_ids.length > 0) {
      const refs = mapIdsToRefs(aiChat.referenced_chat_ids);
      if (refs.length > 0) {
        return refs;
      }
    }

    if (aiChat?.referenced_chat && aiChat?.referenced_chat_id) {
      const ref = buildFromObject({
        id: aiChat.referenced_chat_id,
        name: aiChat.referenced_chat.name,
        description: aiChat.referenced_chat.description,
        details: aiChat.referenced_chat.details,
        title: aiChat.referenced_chat.title,
      });
      if (ref) {
        return [ref];
      }
    }

    return undefined;
  };
  
  // Resolve title for the current chat
  const isNewChatId = chatId ? /^\d{13,}$/.test(chatId) : false;

  // Prefer title passed via navigation state or query string for new chats
  const locationState = location.state as { title?: string } | null;
  const stateTitle = locationState?.title;
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const queryTitle = searchParams.get('title') || undefined;

  // Persist and retrieve titles for new chats using localStorage so refresh keeps it
  const storageKey = chatId ? `chatTitle:${chatId}` : '';
  const storedTitle = typeof window !== 'undefined' && storageKey
    ? window.localStorage.getItem(storageKey) || undefined
    : undefined;

  const resolvedNewChatTitle = ((): string | undefined => {
    const titleCandidate = stateTitle ?? queryTitle ?? storedTitle;
    if (titleCandidate && storageKey) {
      try {
        window.localStorage.setItem(storageKey, titleCandidate);
      } catch {}
    }
    return titleCandidate;
  })();

  // Get conversation data from context
  const conversation = useMemo(() => {
    if (!chatId || !projectId) {
      return {
        id: chatId,
        title: '',
        createdAt: '',
        details: '',
      } as const;
    }
    
    // Check chatsByProject first, then fall back to sidebarChatsByProject
    const chatsList = chatsByProject[projectId] || [];
    const sidebarList = sidebarChatsByProject[projectId] || [];
    const chat = chatsList.find(c => c.id === chatId) || sidebarList.find(c => c.id === chatId);
    
    return {
      id: chatId,
      title: chat?.title || (isNewChatId ? resolvedNewChatTitle ?? '' : ''),
      createdAt: '',
      details: chat?.details || '',
    } as const;
  }, [chatId, projectId, chatsByProject, sidebarChatsByProject, isNewChatId, resolvedNewChatTitle]);
  // Commented out fetchChatById - we already have chat data from project chats API
  // useEffect(() => {
  //   (async () => {
  //     if (!chatId || !projectId) return;
  //     setIsMetaLoading(true);
  //     try {
  //       const data = await fetchChatById(chatId);
  //       if (data?.id && data.project_id) {
  //         // Always hydrate with fresh data to ensure we have latest title/details
  //         hydrateProjectChats(data.project_id.toString(), [{
  //           id: data.id.toString(),
  //           title: data.name,
  //           details: data.description
  //         }]);
  //       }
  //     } catch {
  //       // Silent fallback - chat might not exist on backend yet
  //     } finally {
  //       setIsMetaLoading(false);
  //     }
  //   })();
  // }, [chatId, projectId, hydrateProjectChats]);
  
  // Load message history when chat opens
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId || !projectId) return;
      
      setIsLoadingHistory(true);
      setCurrentPage(1);
      setMessages([]);
      lastScrollTop.current = 0;
      
      try {
        const response = await getChatMessages(chatId, 1, 10);
        if (response.success && response.ai_chats) {
          // Store the first (latest) message ID as fallback
          if (response.ai_chats.length > 0 && response.ai_chats[0].id) {
            try {
              window.localStorage.setItem('lastMessageId', response.ai_chats[0].id.toString());
            } catch (e) {
              // Silently fail if localStorage is not available
            }
          }
          
          // Convert API messages to UI message format
          const loadedMessages: Message[] = [];
          
          // Process messages with file attachments
          for (const aiChat of response.ai_chats) {
            // Use file_reference_details from API response if available
            const attachments = aiChat.file_reference_details?.length 
              ? aiChat.file_reference_details.map(file => ({ ...file, uploadStatus: 'success' as const }))
              : undefined;
            
            const fileIds = aiChat.file_references || [];
            const chatRefDetails = buildChatReferences(aiChat);
            
            // Add user message
            loadedMessages.push({
              id: `user-${aiChat.id}`,
              content: aiChat.user_question,
              role: 'user',
              timestamp: aiChat.created_at,
              attachments: attachments,
              file_references: fileIds.length > 0 ? fileIds : undefined,
              chat_references: chatRefDetails,
              user_info: aiChat.user_info ? {
                id: aiChat.user_info.id,
                first_name: aiChat.user_info.first_name,
                last_name: aiChat.user_info.last_name,
                email: aiChat.user_info.email,
                username: aiChat.user_info.username,
                role: aiChat.user_info.role,
              } : undefined,
            });
            
            // Add assistant message
            loadedMessages.push({
              id: `assistant-${aiChat.id}`,
              content: aiChat.ai_answer,
              role: 'assistant',
              timestamp: aiChat.created_at,
              sources: aiChat.rag_metadata?.sources || undefined,
            });
          }
          
          // Always set messages, even if empty array
          setMessages(sortMessagesByTimestamp(loadedMessages));
          setHasMoreMessages(response.pagination.has_next);
        } else {
          // Handle unexpected response format
          setMessages([]);
          setHasMoreMessages(false);
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
        showErrorToast(t('chat.interface.loadMessagesError', { tryAgain: t('common.errors.tryAgain') }));
        setMessages([]); // Clear messages on error to show empty state
        setHasMoreMessages(false);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadMessages();
  }, [chatId, projectId]);

  useEffect(() => {
    if (projectId) {
      ensureProjectChatsLoaded(projectId);
    }
  }, [projectId, ensureProjectChatsLoaded]);

  useEffect(() => {
    let isCancelled = false;

    if (!chatId) {
      setPersistedReferenceIds([]);
      setChatReferences([]);
      return;
    }

    setPersistedReferenceIds([]);
    setChatReferences([]);

    const loadChatReferences = async () => {
      try {
        const response = await getChatReferencesMapping(chatId);
        if (isCancelled) return;

        // Get stored last message ID from localStorage
        let storedLastMessageId: number | null = null;
        try {
          const stored = window.localStorage.getItem('lastMessageId');
          if (stored) {
            storedLastMessageId = parseInt(stored, 10);
            if (Number.isNaN(storedLastMessageId)) {
              storedLastMessageId = null;
            }
          }
        } catch (e) {
          // Silently fail if localStorage is not available
        }

        const ids = (() => {
          const normalized = new Map<string, PersistedReference>();

          const addFromArray = (
            values?:
              | Array<number | string | { id?: number | string; chat_id?: number | string; name?: string; title?: string }>
              | null
          ) => {
            if (!Array.isArray(values)) return;
            values.forEach((value) => {
              const entry = normalizeReferenceValue(value);
              if (!entry) return;
              const existing = normalized.get(entry.id);
              if (!existing || (!existing.title && entry.title)) {
                normalized.set(entry.id, entry);
              }
            });
          };

          if (response?.references && typeof response.references === 'object') {
            // Get all message IDs (keys) and find the last one
            const messageIds = Object.keys(response.references);
            if (messageIds.length > 0) {
              // Sort message IDs numerically and get the last (highest) one
              const sortedIds = messageIds
                .map((id) => parseInt(id, 10))
                .filter((num) => !Number.isNaN(num))
                .sort((a, b) => a - b);
              const lastMessageId = sortedIds[sortedIds.length - 1];

              if (lastMessageId !== undefined) {
                // Validate: compare with stored last message ID
                if (storedLastMessageId !== null && lastMessageId !== storedLastMessageId) {
                  // IDs don't match, return empty array
                  return [];
                }

                const lastMessageKey = lastMessageId.toString();
                // Only process references from the last message
                const lastMessageRefs = response.references[lastMessageKey];
                if (Array.isArray(lastMessageRefs)) {
                  addFromArray(lastMessageRefs);
                } else if (lastMessageRefs) {
                  addFromArray(lastMessageRefs.referenced_chats);
                  addFromArray(lastMessageRefs.referenced_chat_ids);
                }
              }
            }
          }

          // Only fallback to top-level references if we didn't find any in references object
          // and we don't have a stored ID to validate against
          if (normalized.size === 0 && storedLastMessageId === null) {
            addFromArray(response?.referenced_chats);
            addFromArray(response?.referenced_chat_ids);
          }

          return Array.from(normalized.values());
        })();

        setPersistedReferenceIds(ids);
      } catch (error) {
        console.error('Failed to load chat references mapping:', error);
        if (!isCancelled) {
          setPersistedReferenceIds([]);
        }
      }
    };

    loadChatReferences();

    return () => {
      isCancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    setChatReferences((prev) => {
      const persistedSet = new Set(persistedReferenceIds.map((ref) => ref.id));
      const manualRefs = prev.filter((ref) => !persistedSet.has(ref.id));

      if (persistedReferenceIds.length === 0) {
        return prev.length === 0 ? prev : [];
      }

      const persistedRefs = persistedReferenceIds.map(({ id, title }) => {
        const meta = getChatMetadata(id);
        const existing = prev.find((ref) => ref.id === id);
        return {
          id,
          title: title || meta?.title || existing?.title || `Chat #${id}`,
          details: meta?.details || existing?.details || '',
        };
      });

      const next = [...persistedRefs, ...manualRefs];
      const isSameLength = next.length === prev.length;
      const isSame =
        isSameLength &&
        next.every(
          (ref, index) =>
            ref.id === prev[index]?.id &&
            ref.title === prev[index]?.title &&
            ref.details === prev[index]?.details
        );

      return isSame ? prev : next;
    });
  }, [persistedReferenceIds, getChatMetadata]);
  
  // Track empty "New Chat" for auto-deletion on unmount
  useEffect(() => {
    if (!chatId || !projectId) return;
    
    // Check if this is a "New Chat" with no messages after loading completes
    if (!isLoadingHistory && conversation.title === 'New Chat' && messages.length === 0) {
      try {
        const emptyChats = JSON.parse(localStorage.getItem(`emptyChats:${projectId}`) || '[]');
        if (!emptyChats.includes(chatId)) {
          emptyChats.push(chatId);
          localStorage.setItem(`emptyChats:${projectId}`, JSON.stringify(emptyChats));
        }
      } catch (e) {
        // Silently fail if localStorage is not available
      }
    }
  }, [chatId, projectId, conversation.title, messages.length, isLoadingHistory]);
  
  // Delete previous empty chat when navigating to different chat
  const prevChatIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (prevChatIdRef.current && prevChatIdRef.current !== chatId && projectId) {
      const prevChatId = prevChatIdRef.current;
      
      try {
        const emptyChats = JSON.parse(localStorage.getItem(`emptyChats:${projectId}`) || '[]');
        
        if (emptyChats.includes(prevChatId)) {
          // Remove from array
          const filtered = emptyChats.filter((id: string) => id !== prevChatId);
          localStorage.setItem(`emptyChats:${projectId}`, JSON.stringify(filtered));
          
          // Delete if still "New Chat"
          const prevChat = chatsByProject[projectId]?.find(c => c.id === prevChatId);
          if (prevChat?.title === 'New Chat') {
            deleteChat(projectId, prevChatId);
          }
        }
      } catch (e) {
        // Silently fail if localStorage is not available
      }
    }
    
    prevChatIdRef.current = chatId || null;
  }, [chatId, projectId, chatsByProject, deleteChat]);
  
  // Delete empty chat when leaving chat interface (but not on refresh)
  useEffect(() => {
    return () => {
      if (!chatId || !projectId) return;
      
      try {
        // Check if we're still on a chat route (refresh) or navigating away
        const isStillOnChatRoute = window.location.pathname.includes('/chat/');
        
        if (!isStillOnChatRoute) {
          const emptyChats = JSON.parse(localStorage.getItem(`emptyChats:${projectId}`) || '[]');
          
          if (emptyChats.includes(chatId)) {
            // Remove from array
            const filtered = emptyChats.filter((id: string) => id !== chatId);
            localStorage.setItem(`emptyChats:${projectId}`, JSON.stringify(filtered));
            
            // Delete chat silently in background
            deleteChatApi(chatId).catch(() => {});
          }
        }
      } catch (e) {
        // Silently fail if localStorage is not available
      }
    };
  }, [chatId, projectId]);
  
  // Scroll to bottom when messages change (but not when loading more or streaming)
  useEffect(() => {
    // Don't auto-scroll when loading older messages via pagination
    // Don't auto-scroll when streaming (user has manual control)
    if (!isPaginationLoadRef.current && !streamingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Reset pagination flag after scroll effect
    isPaginationLoadRef.current = false;
  }, [messages, streamingMessageId]);
  
  // Character-by-character typing animation with adaptive speed
  useEffect(() => {
    if (!streamingMessageId) return;
    
    // If we've caught up with the buffer, stop
    if (displayedContent === streamingContent) return;
    
    // If streaming content is empty, reset displayed content
    if (streamingContent === '') {
      setDisplayedContent('');
      return;
    }
    
    // Maximum speed animation - always fastest
    const delay = 10; // Fast typing speed (5ms per tick)
    const charsToAdd = 5; // Characters per tick for visible typing effect
    
    // Animate characters
    const timer = setTimeout(() => {
      const nextLength = Math.min(displayedContent.length + charsToAdd, streamingContent.length);
      setDisplayedContent(streamingContent.slice(0, nextLength));
    }, delay);
    
    return () => clearTimeout(timer);
  }, [streamingContent, displayedContent, streamingMessageId]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);
  
  // Load more messages when scrolling to top
  const loadMoreMessages = async () => {
    if (!chatId || !hasMoreMessages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const response = await getChatMessages(chatId, nextPage, 10);
      if (response.success && response.ai_chats) {
        const olderMessages: Message[] = [];
        
        // Process messages with file attachments
        for (const aiChat of response.ai_chats) {
          // Use file_reference_details from API response if available
          const attachments = aiChat.file_reference_details?.length 
            ? aiChat.file_reference_details.map(file => ({ ...file, uploadStatus: 'success' as const }))
            : undefined;
          
          const fileIds = aiChat.file_references || [];
          const chatRefDetails = buildChatReferences(aiChat);
          
          olderMessages.push({
            id: `user-${aiChat.id}`,
            content: aiChat.user_question,
            role: 'user',
            timestamp: aiChat.created_at,
            attachments: attachments,
            file_references: fileIds.length > 0 ? fileIds : undefined,
            chat_references: chatRefDetails,
            user_info: aiChat.user_info ? {
              id: aiChat.user_info.id,
              first_name: aiChat.user_info.first_name,
              last_name: aiChat.user_info.last_name,
              email: aiChat.user_info.email,
              username: aiChat.user_info.username,
              role: aiChat.user_info.role,
            } : undefined,
          });
          
          olderMessages.push({
            id: `assistant-${aiChat.id}`,
            content: aiChat.ai_answer,
            role: 'assistant',
            timestamp: aiChat.created_at,
            sources: aiChat.rag_metadata?.sources || undefined,
          });
        }
        
        // Prepend older messages to the beginning
        isPaginationLoadRef.current = true; // Set flag before updating messages
        setMessages((prev) => sortMessagesByTimestamp([...olderMessages, ...prev]));
        setCurrentPage(nextPage);
        setHasMoreMessages(response.pagination.has_next);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      showErrorToast(t('chat.interface.loadMoreError'));
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Handle scroll event
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const currentScrollTop = target.scrollTop;
    
    // Check if user is scrolling UP (decreasing scrollTop)
    const isScrollingUp = currentScrollTop < lastScrollTop.current;
    
    // Update last scroll position
    lastScrollTop.current = currentScrollTop;
    
    // Only load more when scrolling UP and near the top
    if (isScrollingUp && currentScrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const updateInlineTrigger = () => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? 0;
    const text = textareaRef.current.value.slice(0, cursor);
    const match = text.match(/@([\w\s-]*)$/);
    if (match) {
      const start = cursor - match[0].length;
      setInlineTrigger({
        start,
        end: cursor,
        keyword: match[1] || '',
      });
      setPickerAnchorRect(textareaRef.current.getBoundingClientRect());
      setPickerPlacement('above');
      setIsReferencePickerOpen(true);
    } else if (inlineTrigger) {
      setInlineTrigger(null);
      setIsReferencePickerOpen(false);
    }
  };

  const handleTextareaKeyUp = () => {
    updateInlineTrigger();
  };

  const handleReferencePickerClose = () => {
    setIsReferencePickerOpen(false);
    setInlineTrigger(null);
  };

  const handleReferenceSelectionChange = (selected: ChatReferenceOption[]) => {
    const hadReferences = chatReferences.length > 0;
    setChatReferences(selected);

    if (!hadReferences && selected.length > 0 && inlineTrigger && textareaRef.current) {
      const nextValue =
        input.slice(0, inlineTrigger.start) + input.slice(inlineTrigger.end, input.length);
      setInput(nextValue);
      const cursorPos = inlineTrigger.start;
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(cursorPos, cursorPos);
      });
    }

    if (selected.length === 0) {
      setInlineTrigger(null);
    }
  };

  const removeChatReference = (chatId: string) => {
    setChatReferences((prev) => prev.filter((ref) => ref.id !== chatId));
  };

  const handleReferenceButtonClick = () => {
    const rect =
      referenceButtonRef.current?.getBoundingClientRect() ||
      textareaRef.current?.getBoundingClientRect() ||
      null;
    setPickerAnchorRect(rect);
    setPickerPlacement('above');
    setInlineTrigger(null);
    setIsReferencePickerOpen((prev) => !prev);
  };
  
  
  // Validate document file type (must match backend allowed types exactly)
  const isValidDocumentType = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
    ];
    
    return allowedTypes.includes(file.type);
  };
  
  // Validate image file type (must match backend allowed types)
  const isValidImageType = (file: File): boolean => {
    const allowedImageTypes = [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    
    return allowedImageTypes.includes(file.type);
  };
  
  // Reusable function to upload files
  const uploadFiles = async (filesToUpload: File[], fileType: 'document' | 'image') => {
    for (const file of filesToUpload) {
      // Validate file type based on selection
      if (fileType === 'document' && !isValidDocumentType(file)) {
        showErrorToast(t('chat.interface.unsupportedDocument'));
        continue;
      }

      if (fileType === 'image' && !isValidImageType(file)) {
        showErrorToast(t('chat.interface.unsupportedImage'));
        continue;
      }

      if (file.type === 'application/pdf') {
        try {
          const pageCount = await getPdfPageCount(file);

          if (pageCount > MAX_PDF_PAGES) {
            showErrorToast(t('chat.interface.pdfTooManyPages', { maxPages: MAX_PDF_PAGES }));
            continue;
          }
        } catch (error) {
          console.error('Failed to read PDF metadata:', error);
          showErrorToast(
            t('chat.interface.pdfValidationError', {
              filename: file.name,
              tryAgain: t('common.errors.tryAgain'),
            })
          );
          continue;
        }
      }

      const placeholderId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const placeholder: FileAttachment = {
        id: placeholderId,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        file_type: fileType,
        type: 'file',
        downloadable: false,
        created_at: new Date().toISOString(),
        uploadStatus: 'uploading',
      };

      setAttachedFiles((prev) => [...prev, placeholder]);

      try {
        // Upload file to backend
        const response = await uploadFile(file);

        if (response.success && response.file) {
          setAttachedFiles((prev) =>
            prev.map((existing) =>
              existing.id === placeholderId
                ? { ...response.file, uploadStatus: 'success' as const }
                : existing
            )
          );
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
        showErrorToast(
          t('chat.interface.uploadError', {
            filename: file.name,
            tryAgain: t('common.errors.tryAgain'),
          })
        );

        setAttachedFiles((prev) =>
          prev.map((existing) =>
            existing.id === placeholderId
              ? { ...existing, uploadStatus: 'error' as const, uploadError: t('chat.interface.uploadFailed') }
              : existing
          )
        );
      }
    }
  };
  
  // Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'document' | 'image') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const filesToUpload = Array.from(files);
    await uploadFiles(filesToUpload, fileType);
    
    // Reset input so the same file can be selected again
    if (fileType === 'document' && fileInputRef.current) {
      fileInputRef.current.value = '';
    } else if (fileType === 'image' && imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };
  
  // Handle paste event for screenshots
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const imageFiles: File[] = [];
    
    // Check clipboard for images
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Only process image types
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          // Generate filename with timestamp and proper extension
          const extension = item.type.split('/')[1] || 'png';
          const filename = `pasted-image-${Date.now()}.${extension}`;
          
          // Create a proper File object from the blob
          const file = new File([blob], filename, { type: item.type });
          imageFiles.push(file);
        }
      }
    }
    
    // Upload pasted images if any were found
    if (imageFiles.length > 0) {
      e.preventDefault(); // Prevent default paste behavior
      await uploadFiles(imageFiles, 'image');
    }
  };
  
  // Remove attached file and delete from backend
  const removeAttachedFile = async (index: number) => {
    const file = attachedFiles[index];
    
    // Don't try to delete if upload is still in progress or failed
    if (file.uploadStatus === 'uploading' || file.uploadStatus === 'error') {
      setAttachedFiles(prev => prev.filter((_, i) => i !== index));
      return;
    }
    
    try {
      // Delete from backend
      await deleteFile(file.id);
      
      // Remove from state
      setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Failed to delete file:', error);
      showErrorToast(t('chat.interface.deleteFileError', { filename: file.filename, tryAgain: t('common.errors.tryAgain') }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !chatId || (!isStreamingComplete && streamingMessageId !== null)) return;
    
    // Check if any files are still uploading
    const hasUploadingFiles = attachedFiles.some(f => f.uploadStatus === 'uploading');
    if (hasUploadingFiles) {
      showErrorToast(t('chat.interface.waitForUploads'));
      return;
    }
    
    // Filter out failed uploads
    const successfulFiles = attachedFiles.filter(f => f.uploadStatus === 'success' || !f.uploadStatus);
    const referencedChatIds = chatReferences.map(ref => ref.id);
    
    // Capture if this is the first message before state updates
    const isFirstMessage = messages.length === 0;
    
    // Clear empty chat tracking since user is sending a message
    if (isFirstMessage && projectId) {
      try {
        const emptyChats = JSON.parse(localStorage.getItem(`emptyChats:${projectId}`) || '[]');
        const filtered = emptyChats.filter((id: string) => id !== chatId);
        localStorage.setItem(`emptyChats:${projectId}`, JSON.stringify(filtered));
      } catch (e) {
        // Silently fail if localStorage is not available
      }
    }
    
    // Extract file IDs for API call
    const fileIds = successfulFiles.map(f => f.id);
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: new Date().toISOString(),
      attachments: successfulFiles.length > 0 ? [...successfulFiles] : undefined,
      file_references: fileIds.length > 0 ? fileIds : undefined,
      chat_references: chatReferences.length > 0 ? [...chatReferences] : undefined,
      user_info: user ? {
        id: parseInt(user.id),
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role,
      } : undefined,
    };
    
    // Add assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessagePlaceholder: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage, assistantMessagePlaceholder]);
    const currentInput = input;
    const currentAttachments = [...successfulFiles];
    setInput('');
    setAttachedFiles([]);
    
    // Scroll to bottom - padding makes latest message appear at top (ChatGPT-style)
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    // Set up streaming state
    setStreamingMessageId(assistantMessageId);
    setStreamingContent('');
    setDisplayedContent('');
    setStreamingSources([]);
    setIsStreamingComplete(false);
    
    try {
      // Prepare file reference details (remove uploadStatus as it's not part of FileMetadata)
      const fileDetails = currentAttachments.length > 0 
        ? currentAttachments.map(({ uploadStatus, uploadError, ...fileMetadata }) => fileMetadata)
        : undefined;
      
      const response = await sendMessageApi(
        chatId, 
        currentInput, 
        fileIds.length > 0 ? fileIds : undefined,
        fileDetails,
        referencedChatIds,
        (streamedText) => {
          // Update streaming content as chunks arrive
          setStreamingContent(streamedText);
        },
        (streamCompleteData) => {
          // Update sources immediately when stream completes
          if (streamCompleteData.rag_metadata?.sources) {
            setStreamingSources(streamCompleteData.rag_metadata.sources);
          }
          // Enable send button immediately when stream completes
          setIsStreamingComplete(true);
          
          // Store last message ID in localStorage
          if (streamCompleteData.ai_chat?.id) {
            try {
              window.localStorage.setItem('lastMessageId', streamCompleteData.ai_chat.id.toString());
            } catch (e) {
              // Silently fail if localStorage is not available
            }
          }
        }
      );
      
      if (response.success && response.ai_chat) {
        const responseChatRefs = buildChatReferences(response.ai_chat);
        // Auto-rename chat IMMEDIATELY based on first message response
        if (response.ai_chat.chat_name && response.ai_chat.chat_name !== "" && projectId) {
          updateChat(projectId, chatId, response.ai_chat.chat_name, '');
        }
        // Calculate time needed for typing animation to complete
        // This ensures smooth animation without sudden "chunk dump" at the end
        const textLength = response.ai_chat.ai_answer.length;
        
        // Estimate based on adaptive speed algorithm:
        // - >500 chars behind: 5 chars per 10ms = 2ms per char
        // - >200 chars behind: 3 chars per 15ms = 5ms per char
        // - >50 chars behind: 2 chars per 20ms = 10ms per char
        // - else: 1 char per 20ms = 20ms per char
        // Average ~10ms per character is a safe estimate
        const estimatedAnimationTime = Math.min(textLength * 10, 20000); // Max 20 seconds
        
        // Start animation timer but don't wait for it - let it run in background
        setTimeout(() => {
          // Animation completed, but streaming state is already cleared
        }, estimatedAnimationTime);
        
        // Update message IDs and metadata in place (no visual change since content is already displayed)
        setMessages((prev) => {
          return prev.map(m => {
            // Update assistant message with backend ID and timestamp
            if (m.id === assistantMessageId) {
              return {
                ...m,
                id: `assistant-${response.ai_chat.id}`,
                content: response.ai_chat.ai_answer,
                // timestamp: response.ai_chat.created_at,
                sources: response.rag_metadata?.sources || undefined,
              };
            }
            // Update user message with backend ID and metadata
            if (m.id === userMessage.id) {
              return {
                ...m,
                id: `user-${response.ai_chat.id}`,
                // timestamp: response.ai_chat.created_at,
                file_references: response.ai_chat.file_references,
                chat_references: responseChatRefs || m.chat_references,
                user_info: response.ai_chat.user_info ? {
                  id: response.ai_chat.user_info.id,
                  first_name: response.ai_chat.user_info.first_name,
                  last_name: response.ai_chat.user_info.last_name,
                  email: response.ai_chat.user_info.email,
                  username: response.ai_chat.user_info.username,
                  role: response.ai_chat.user_info.role,
                } : m.user_info,
              };
            }
            return m;
          });
        });

        const responseReferencedIds = Array.isArray(response.ai_chat.referenced_chat_ids)
          ? response.ai_chat.referenced_chat_ids
              .map((id) => normalizeReferenceValue(id))
              .filter((value): value is PersistedReference => Boolean(value))
          : [];

        setPersistedReferenceIds(responseReferencedIds);
        setChatReferences(responseChatRefs ?? []);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showErrorToast(t('chat.interface.sendError', { tryAgain: t('common.errors.tryAgain') }));
      
      // Remove the placeholder assistant message on error
      setMessages((prev) => prev.filter(m => m.id !== assistantMessageId));
    } finally {
      // Clear streaming state immediately after resolve
      setStreamingMessageId(null);
      setStreamingContent('');
      setDisplayedContent('');
      setIsStreamingComplete(false);
    }
  };

  return (
    <>
      <div className="h-full flex overflow-hidden">
      {/* Chat interface */}
      <div className="flex-1 flex flex-col bg-light-200">
        {/* Chat header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="p-2 mr-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={t('chat.interface.backToProject')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">{conversation.title}</h1>
                {isMetaLoading && <Loader size="sm" color="gray" />}
              </div>
              {!!conversation.details && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1" title={conversation.details}>{conversation.details}</p>
              )}
            </div>
          </div>
          {/* <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div> */}
        </div>
        
        {/* Loading history indicator */}
        {isLoadingHistory && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">{t('chat.interface.loadingConversation')}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium mb-1">{t('chat.interface.startConversation')}</p>
              <p className="text-sm">{t('chat.interface.startConversationMessage')}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {!isLoadingHistory && messages.length > 0 && (
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4" 
            style={{
              scrollbarWidth: 'none', 
              paddingBottom: streamingMessageId ? 'calc(100vh - 430px)' : '0'
            }}
            onScroll={handleScroll}
          >
            <div className="mx-auto max-w-3xl space-y-6 px-2 md:px-0">
              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-2 mx-auto max-w-3xl">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`group flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Attachments above the bubble */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className={`${
                      message.role === 'user'
                        ? 'self-end w-fit max-w-[85%]'
                        : 'self-start w-full max-w-[85%]'
                    } flex flex-wrap gap-2 mb-1`}>
                      {message.attachments.map((file, index) => {
                        const isImage = file.mime_type.startsWith('image/');
                        
                        return (
                          /* Unified chip for both documents and images */
                          <div
                            key={file.id || index}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 max-w-full ${
                              message.role === 'user' ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {isImage ? (
                              /* Image icon */
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              /* Document icon */
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm truncate">{file.filename}</div>
                              <div className="text-xs opacity-80 truncate">
                                {(file.size_bytes / 1024).toFixed(1)} KB{file.file_type && ` • ${file.file_type}`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Message bubble */}
                  <div
                    className={`${message.role === 'user' ? 'w-fit max-w-[85%] rounded-2xl px-3 py-2 bg-primary-600 text-white' : 'w-full'}`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="leading-6">
                        {streamingMessageId === message.id && displayedContent === '' ? (
                          // Show blue pulsating dot when streaming starts but no content yet
                          <div className="flex space-x-2 py-2">
                            <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></div>
                            <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        ) : (
                          <>
                            <MarkdownMessage 
                              content={streamingMessageId === message.id ? displayedContent : message.content} 
                            />
                            {/* Sources chips - always display if available */}
                            {((streamingMessageId === message.id && streamingSources.length > 0) || (message.sources && message.sources.length > 0)) && (
                              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
                                {Array.from(new Set(streamingMessageId === message.id ? streamingSources : message.sources || [])).map((source, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const success = downloadRagFile(source);
                                      if (!success) {
                                        showErrorToast(t('chat.interface.downloadError', { filename: source }));
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[12px] font-normal hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer"
                                    title={`Click to download: ${source}`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="truncate max-w-[80px]">{source}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      message.content && (
                        <div className="whitespace-pre-wrap leading-6">{message.content}</div>
                      )
                    )}
                  </div>
                  {/* Author info and chat references for user messages */}
                  {message.role === 'user' && (message.user_info || (message.chat_references && message.chat_references.length > 0)) && (
                    <div className="mt-1.5 flex flex-col gap-1.5 justify-end max-w-[85%]">
                      {/* Chat references */}
                      {message.chat_references && message.chat_references.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-xs">
                          {message.chat_references.map((ref) => (
                            <span
                              key={ref.id}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-primary-50 text-primary-800"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.586 5.586a2 2 0 010 2.828l-4 4a2 2 0 11-2.828-2.828l1.172-1.172a1 1 0 10-1.414-1.414l-1.172 1.172a4 4 0 105.657 5.657l4-4a4 4 0 10-5.657-5.657l-1.172 1.172a1 1 0 101.414 1.414l1.172-1.172a2 2 0 012.829 0z" clipRule="evenodd" />
                              </svg>
                              <span className="max-w-[140px] truncate" title={ref.title}>{ref.title}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Author info */}
                      {message.user_info && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold ${getAvatarColor(message.user_info.id)}`}>
                            {getInitials(message.user_info.first_name, message.user_info.last_name)}
                          </div>
                          <span className="text-xs text-gray-500">
                            {message.user_info.first_name} {message.user_info.last_name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Chat references for assistant messages (keep existing behavior) */}
                  {message.role === 'assistant' && message.chat_references && message.chat_references.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-xs self-start">
                      {message.chat_references.map((ref) => (
                        <span
                          key={ref.id}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-gray-100 text-gray-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.586 5.586a2 2 0 010 2.828l-4 4a2 2 0 11-2.828-2.828l1.172-1.172a1 1 0 10-1.414-1.414l-1.172 1.172a4 4 0 105.657 5.657l4-4a4 4 0 10-5.657-5.657l-1.172 1.172a1 1 0 101.414 1.414l1.172-1.172a2 2 0 012.829 0z" clipRule="evenodd" />
                          </svg>
                          <span className="max-w-[140px] truncate" title={ref.title}>{ref.title}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Timestamp below message container, visible on hover */}
                  <div
                    className={`${
                      message.role === 'user'
                        ? 'self-end max-w-[85%] text-right text-primary-400'
                        : 'self-start w-full text-left text-gray-500'
                    } text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
        
        {/* Input area - Only visible for owner or editor */}
        {(projectRole === 'owner' || projectRole === 'editor') ? (
          <div className="border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <div className="flex-1 rounded-lg border border-gray-200 p-2">
              {chatReferences.length > 0 && (
                <p className='text-sm text-gray-500 mb-2'>{chatReferences.length > 1 ? `${chatReferences.length} chat references attached.` : `${chatReferences.length} chat reference attached.`}</p>
              )}
              {/* Display attached files before sending */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => {
                    const isImage = file.mime_type.startsWith('image/');
                    
                    return (
                      <div key={file.id} className="relative">
                        {/* Unified chip for both documents and images */}
                        <div className={`flex items-center space-x-2 border rounded px-3 py-2 pr-8 relative ${
                          file.uploadStatus === 'uploading' ? 'bg-blue-50 border-blue-300' :
                          file.uploadStatus === 'error' ? 'bg-red-50 border-red-300' :
                          'bg-white border-gray-300'
                        }`}>
                          {file.uploadStatus === 'uploading' ? (
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : file.uploadStatus === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : isImage ? (
                            /* Image icon */
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            /* Document icon */
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <div className="flex flex-col">
                            <span className={`text-sm max-w-[150px] truncate ${
                              file.uploadStatus === 'error' ? 'text-red-700' : 'text-gray-700'
                            }`}>{file.filename}</span>
                            <span className={`text-xs ${
                              file.uploadStatus === 'uploading' ? 'text-blue-600' :
                              file.uploadStatus === 'error' ? 'text-red-600' :
                              'text-gray-500'
                            }`}>
                              {file.uploadStatus === 'uploading' ? t('chat.interface.uploading') :
                               file.uploadStatus === 'error' ? t('chat.interface.uploadFailed') :
                               t('chat.interface.fileSize', { size: (file.size_bytes / 1024).toFixed(1) })}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachedFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                            title={t('chat.interface.removeFile')}
                            disabled={file.uploadStatus === 'uploading'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'document')}
                  className="hidden"
                  accept="application/pdf,text/plain"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'image')}
                  className="hidden"
                  accept="image/gif,image/jpeg,image/png,image/webp"
                />
                
                {/* Plus button with dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-1.5 rounded-full hover:bg-gray-200 shrink-0"
                    title={t('chat.interface.addAttachments')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-left text-sm text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        <span>{t('chat.interface.addFiles')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          imageInputRef.current?.click();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-left text-sm text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span>{t('chat.interface.addPhotos')}</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  ref={referenceButtonRef}
                  onClick={handleReferenceButtonClick}
                  className="p-1.5 rounded-full hover:bg-gray-200 shrink-0"
                  title="Reference previous chats"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                    @
                  </span>
                </button>
                <textarea
                  ref={textareaRef}
                  className="w-full bg-transparent resize-none focus:outline-none py-1 max-h-24 overflow-y-auto scrollbar-thin"
                  placeholder={t('chat.interface.typeMessage')}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  onKeyUp={handleTextareaKeyUp}
                  onClick={handleTextareaKeyUp}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={(!isStreamingComplete && streamingMessageId !== null) || !input.trim()}
                  className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  title={t('chat.interface.send')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform -rotate-90" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            </form>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto text-center text-gray-500 text-sm">
              <p>{t('chat.interface.noPermission')}</p>
            </div>
          </div>
        )}
      </div>
      </div>
      <ChatReferencePicker
        projectId={projectId}
        isOpen={isReferencePickerOpen}
        anchorRect={pickerAnchorRect}
        placement={pickerPlacement}
        excludeChatId={chatId}
        selectedChats={chatReferences}
        searchTerm={inlineTrigger?.keyword}
        onSelectionChange={handleReferenceSelectionChange}
        onClose={handleReferencePickerClose}
      />
    </>
  );
};

export default ChatInterface;

