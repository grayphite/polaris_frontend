import { useLocation, useParams } from 'react-router-dom';
import { useChats } from '../../context/ChatContext';
import { fetchChatById } from '../../services/chatService';
import React, { useEffect, useRef, useState } from 'react';

import Button from '../../components/ui/Button';
import Loader from '../../components/common/Loader';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

const ChatInterface: React.FC = () => {
  const { projectId, chatId } = useParams<{ projectId: string; chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  
  const { chatsByProject, hydrateProjectChats } = useChats();
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

  // Mock conversation data
  const conversation = {
    id: chatId,
    title: (() => {
      if (!chatId) return '';
      const list = projectId ? (chatsByProject[projectId] || []) : [];
      const fromContext = list.find(c => c.id === chatId)?.title;
      if (fromContext) return fromContext;
      if (isNewChatId) return resolvedNewChatTitle ?? '';
      return `Chat ${chatId}`;
    })(),
    createdAt: '2023-10-01T12:00:00Z',
    details: (() => {
      if (!chatId) return '';
      const list = projectId ? (chatsByProject[projectId] || []) : [];
      const chat = list.find(c => c.id === chatId);
      return chat?.details || '';
    })(),
  } as const;
  
  // Load initial messages
  useEffect(() => {
    // In a real app, you would fetch messages from an API
    // For brand new conversations, start blank
    if (chatId && /^\d{13,}$/.test(chatId)) {
      setMessages([]);
      return;
    }
    // Otherwise load mock history
    setMessages([
      {
        id: '1',
        content: "Hi there! I'm your AI assistant. How can I help you with your social media strategy today?",
        role: 'assistant',
        timestamp: '2023-10-01T12:01:00Z',
      },
      {
        id: '2',
        content: "I need help planning our Instagram content for the product launch next month. We're targeting millennials and Gen Z.",
        role: 'user',
        timestamp: '2023-10-01T12:02:30Z',
      },
      {
        id: '3',
        content: "Great! For Instagram content targeting millennials and Gen Z for a product launch...",
        role: 'assistant',
        timestamp: '2023-10-01T12:03:45Z',
      },
    ]);
  }, [chatId]);

  // Always fetch fresh chat data when switching to a chat to ensure latest title/details
  useEffect(() => {
    (async () => {
      if (!chatId) return;
      setIsMetaLoading(true);
      try {
        const data = await fetchChatById(chatId);
        if (data?.id && data.projectId) {
          // Always hydrate with fresh data to ensure we have latest title/details
          hydrateProjectChats(data.projectId, [{
            id: data.id,
            title: data.title,
            details: data.details
          }]);
        }
      } catch {
        // Silent fallback - chat might not exist on backend yet
      } finally {
        setIsMetaLoading(false);
      }
    })();
  }, [chatId, hydrateProjectChats]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Simulate AI response
    setIsTyping(true);
    
    // In a real app, you would make an API call to your backend
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: generateResponse(input),
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };
  
  // Simple mock response generator
  const generateResponse = (userInput: string): string => {
    const responses = [
      "That's a great point about social media strategy. I recommend focusing on creating authentic content that resonates with your target audience. Consider using user-generated content and engaging with your followers regularly.",
      "For your Instagram campaign, I suggest using a mix of Stories, Reels, and feed posts. Stories are great for behind-the-scenes content, Reels for trending challenges, and feed posts for polished product features.",
      "When targeting Gen Z and millennials, remember that authenticity is key. They value brands that take stands on social issues and demonstrate their values consistently.",
      "For your content calendar, I recommend planning themes for each week of the month. This creates consistency while allowing for variety in your content.",
      "Hashtag strategy is important for discoverability. Use a mix of popular, niche, and branded hashtags. Aim for about 5-10 hashtags per post for optimal reach.",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-gray-200"
                    title="Format text"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </button>
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

