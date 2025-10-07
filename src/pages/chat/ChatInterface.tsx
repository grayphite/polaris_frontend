import { AnimatePresence, motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';

import Button from '../../components/ui/Button';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Mock conversation data
  const conversation = {
    id: chatId,
    title: 'Social Media Strategy',
    createdAt: '2023-10-01T12:00:00Z',
  };
  
  // Mock conversations list
  const conversations = [
    {
      id: '1',
      title: 'Social Media Strategy',
      updatedAt: '2023-10-05T14:45:00Z',
    },
    {
      id: '2',
      title: 'Email Campaign Planning',
      updatedAt: '2023-10-04T09:20:00Z',
    },
    {
      id: '3',
      title: 'Content Calendar',
      updatedAt: '2023-10-03T16:10:00Z',
    },
    {
      id: '4',
      title: 'Budget Allocation',
      updatedAt: '2023-10-02T11:30:00Z',
    },
  ];
  
  // Load initial messages
  useEffect(() => {
    // In a real app, you would fetch messages from an API
    const initialMessages: Message[] = [
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
        content: "Great! For Instagram content targeting millennials and Gen Z for a product launch, I'd recommend the following approach:\n\n1. **Content Mix**: Create a balanced mix of educational content about your product features, lifestyle imagery showing the product in use, user-generated content, and behind-the-scenes looks at the launch preparations.\n\n2. **Format Variety**: Utilize all Instagram formats - feed posts, Stories, Reels, and IGTV for longer content. Reels are particularly effective for reaching younger audiences right now.\n\n3. **Pre-launch Teaser Campaign**: Start building excitement 2-3 weeks before launch with teaser content that creates intrigue without revealing everything.\n\n4. **Influencer Collaborations**: Partner with micro-influencers who align with your brand values and have high engagement with your target demographic.\n\n5. **Interactive Elements**: Incorporate polls, questions, and countdown stickers in Stories to boost engagement and create anticipation.\n\nWould you like me to elaborate on any of these points or suggest specific content ideas for each phase of your launch?",
        role: 'assistant',
        timestamp: '2023-10-01T12:03:45Z',
      },
    ];
    
    setMessages(initialMessages);
  }, [chatId]);
  
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
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Sidebar with conversations */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border-r border-gray-200 flex flex-col w-80 flex-shrink-0"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
                <Link to={`/projects/${projectId}/chat/new`}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    }
                  >
                    New
                  </Button>
                </Link>
              </div>
              <div className="mt-2 relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/projects/${projectId}/chat/${conv.id}`}
                  className={`block p-3 mb-1 rounded-md transition-colors ${
                    conv.id === chatId
                      ? 'bg-primary-50 border-l-4 border-primary-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{conv.title}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Link to={`/projects/${projectId}`}>
                <Button variant="outline" fullWidth>
                  Back to Project
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat interface */}
      <div className="flex-1 flex flex-col bg-light-200">
        {/* Chat header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{conversation.title}</h1>
          </div>
          <div className="flex items-center space-x-2">
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
          </div>
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
