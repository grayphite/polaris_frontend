import { useLocation, useParams } from 'react-router-dom';
import { useChats } from '../../context/ChatContext';
import { fetchChatById, sendMessageApi, getChatMessages } from '../../services/chatService';
import React, { useEffect, useRef, useState } from 'react';

import Button from '../../components/ui/Button';
import Loader from '../../components/common/Loader';
import { showErrorToast } from '../../utils/toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

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
  const { projectId, chatId } = useParams<{ projectId: string; chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);
  const isPaginationLoadRef = useRef(false);
  const location = useLocation();
  
  const { chatsByProject, hydrateProjectChats, updateChat } = useChats();
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  
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
  const conversation = {
    id: chatId,
    title: (() => {
      if (!chatId) return '';
      const list = projectId ? (chatsByProject[projectId] || []) : [];
      const fromContext = list.find(c => c.id === chatId)?.title;
      if (fromContext) return fromContext;
      if (isNewChatId) return resolvedNewChatTitle ?? '';
      return '';
    })(),
    createdAt: '',
    details: (() => {
      if (!chatId) return '';
      const list = projectId ? (chatsByProject[projectId] || []) : [];
      const chat = list.find(c => c.id === chatId);
      return chat?.details || '';
    })(),
  } as const;
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
          // Convert API messages to UI message format
          const loadedMessages: Message[] = [];
          
          response.ai_chats.forEach((aiChat) => {
            // Add user message
            loadedMessages.push({
              id: `user-${aiChat.id}`,
              content: aiChat.user_question,
              role: 'user',
              timestamp: aiChat.created_at,
            });
            
            // Add assistant message
            loadedMessages.push({
              id: `assistant-${aiChat.id}`,
              content: aiChat.ai_answer,
              role: 'assistant',
              timestamp: aiChat.created_at,
            });
          });
          
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
        showErrorToast('Failed to load messages. Please try again.');
        setMessages([]); // Clear messages on error to show empty state
        setHasMoreMessages(false);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadMessages();
  }, [chatId, projectId]);
  
  // Scroll to bottom when messages change (but not when loading more)
  useEffect(() => {
    // Don't auto-scroll when loading older messages via pagination
    if (!isPaginationLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Reset pagination flag after scroll effect
    isPaginationLoadRef.current = false;
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  // Load more messages when scrolling to top
  const loadMoreMessages = async () => {
    if (!chatId || !hasMoreMessages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const response = await getChatMessages(chatId, nextPage, 10);
      if (response.success && response.ai_chats) {
        const olderMessages: Message[] = [];
        
        response.ai_chats.forEach((aiChat) => {
          olderMessages.push({
            id: `user-${aiChat.id}`,
            content: aiChat.user_question,
            role: 'user',
            timestamp: aiChat.created_at,
          });
          
          olderMessages.push({
            id: `assistant-${aiChat.id}`,
            content: aiChat.ai_answer,
            role: 'assistant',
            timestamp: aiChat.created_at,
          });
        });
        
        // Prepend older messages to the beginning
        isPaginationLoadRef.current = true; // Set flag before updating messages
        setMessages((prev) => sortMessagesByTimestamp([...olderMessages, ...prev]));
        setCurrentPage(nextPage);
        setHasMoreMessages(response.pagination.has_next);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      showErrorToast('Failed to load more messages.');
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !chatId) return;
    
    // Capture if this is the first message before state updates
    const isFirstMessage = messages.length === 0;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    
    // Call real AI API
    setIsTyping(true);
    
    try {
      const response = await sendMessageApi(chatId, currentInput);
      
      if (response.success && response.ai_chat) {
        // Update both messages to use backend timestamp for consistency
        const userMessageWithBackendTime: Message = {
          id: `user-${response.ai_chat.id}`,
          content: currentInput,
          role: 'user',
          timestamp: response.ai_chat.created_at,
        };
        
        const assistantMessage: Message = {
          id: `assistant-${response.ai_chat.id}`,
          content: response.ai_chat.ai_answer,
          role: 'assistant',
          timestamp: response.ai_chat.created_at,
        };
        
        setMessages((prev) => {
          // Remove the optimistic user message and add both with backend timestamp
          const withoutOptimistic = prev.filter(m => m.id !== userMessage.id);
          return sortMessagesByTimestamp([...withoutOptimistic, userMessageWithBackendTime, assistantMessage]);
        });
        
        // Auto-rename chat based on first message response only
        if (response.ai_chat.chat_name && projectId && isFirstMessage) {
          updateChat(projectId, chatId, response.ai_chat.chat_name, '');
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showErrorToast('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };
  
  
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Chat interface */}
      <div className="flex-1 flex flex-col bg-light-200">
        {/* Chat header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
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
              <p className="text-sm text-gray-500">Loading conversation...</p>
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
              <p className="text-lg font-medium mb-1">Start a conversation</p>
              <p className="text-sm">Send a message to begin chatting</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {!isLoadingHistory && messages.length > 0 && (
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-6" 
            style={{scrollbarWidth: 'none'}}
            onScroll={handleScroll}
          >
            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-1 text-right ${
                      message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <div className="flex-1 bg-light-200 rounded-lg p-2">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent resize-none focus:outline-none"
                placeholder="Type your message..."
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex space-x-1">
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-gray-200"
                    title="Upload file"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {/* <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-gray-200"
                    title="Format text"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </button> */}
                </div>
                <div className="text-xs text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isTyping || !input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

