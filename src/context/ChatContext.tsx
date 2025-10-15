import React, { createContext, useContext, useMemo, useState } from 'react';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { createChatApi, deleteChatApi, fetchChats, updateChatApi } from '../services/chatService';
import { getChatDetails, removeChatDetails, setChatDetails } from '../services/chatsStorage';

export type Chat = { id: string; projectId: string; title: string };

type ChatContextValue = {
  chatsByProject: Record<string, Chat[]>;
  getChatDetails: (chatId: string) => string;
  createChat: (projectId: string, title: string, details: string) => string; // returns id
  updateChat: (projectId: string, chatId: string, title: string, details: string) => void;
  deleteChat: (projectId: string, chatId: string) => void;
  hydrateProjectChats: (projectId: string, chats: Array<{ id: string; title: string; details?: string }>) => void;
  ensureProjectChatsLoaded: (projectId: string) => Promise<void>;
  clearProjectChats: (projectId: string) => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatsByProject, setChatsByProject] = useState<Record<string, Chat[]>>({
    '1': [
      { id: '1', projectId: '1', title: 'Social Media Strategy' },
      { id: '2', projectId: '1', title: 'Email Campaign Planning' },
      { id: '3', projectId: '1', title: 'Content Calendar' },
    ],
    '2': [
      { id: '4', projectId: '2', title: 'Roadmap Q4' },
      { id: '5', projectId: '2', title: 'Stakeholder Feedback' },
    ],
    '3': [
      { id: '6', projectId: '3', title: 'Interview Notes' },
    ],
  });

  // Seed demo chat details
  React.useEffect(() => {
    const demoDetails = {
      '1': 'Social media strategy for Q4 product launch including Instagram, Twitter, and LinkedIn campaigns targeting millennials and Gen Z.',
      '2': 'Email marketing campaign planning for product launch with segmentation, automation, and A/B testing strategies.',
      '3': 'Content calendar planning for Q4 with themes, posting schedules, and content types across all platforms.',
      '4': 'Q4 roadmap planning with feature prioritization, stakeholder alignment, and resource allocation.',
      '5': 'Stakeholder feedback collection and analysis for product improvements and feature requests.',
      '6': 'Customer interview notes and insights for product development and market research.',
    };
    
    Object.entries(demoDetails).forEach(([chatId, details]) => {
      if (!getChatDetails(chatId)) {
        setChatDetails(chatId, details);
      }
    });
  }, []);

  const getChatDetailsValue = (chatId: string) => getChatDetails(chatId);

  const hydrateProjectChats = (projectId: string, chats: Array<{ id: string; title: string; details?: string }>) => {
    if (!Array.isArray(chats) || chats.length === 0) return;
    setChatsByProject(prev => {
      const current = prev[projectId] || [];
      // merge by id, prefer incoming
      const byId: Record<string, Chat> = {};
      [...current, ...chats.map(c => ({ id: c.id, projectId, title: c.title }))].forEach(c => { byId[c.id] = c; });
      return { ...prev, [projectId]: Object.values(byId) };
    });
    chats.forEach(c => { if (typeof c.details === 'string') setChatDetails(c.id, c.details); });
  };

  const ensureProjectChatsLoaded = async (projectId: string) => {
    const existing = chatsByProject[projectId];
    if (existing && existing.length) return;
    try {
      const remote = await fetchChats(projectId);
      hydrateProjectChats(projectId, remote.map(r => ({ id: r.id, title: r.title, details: r.details })));
    } catch {
      // silent: backend might not implement this optimization
    }
  };

  const clearProjectChats = (projectId: string) => {
    setChatsByProject(prev => {
      const { [projectId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const createChat = (projectId: string, title: string, details: string) => {
    const optimisticId = Date.now().toString();
    setChatsByProject(prev => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: [{ id: optimisticId, projectId, title }, ...list] };
    });
    setChatDetails(optimisticId, details);
    (async () => {
      try {
        const created = await createChatApi(projectId, title, details);
        if (created?.id && created.id !== optimisticId) {
          setChatsByProject(prev => {
            const list = prev[projectId] || [];
            return {
              ...prev,
              [projectId]: list.map(c => (c.id === optimisticId ? { id: created.id, projectId, title: created.title || title } : c)),
            };
          });
          setChatDetails(created.id, created.details || details);
          removeChatDetails(optimisticId);
        }
        showSuccessToast('Chat created');
      } catch (err) {
        showErrorToast('Failed to create chat');
      }
    })();
    return optimisticId;
  };

  const updateChat = (projectId: string, chatId: string, title: string, details: string) => {
    setChatsByProject(prev => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: list.map(c => (c.id === chatId ? { ...c, title } : c)) };
    });
    setChatDetails(chatId, details);
    (async () => {
      try {
        await updateChatApi(chatId, title, details);
        showSuccessToast('Chat updated');
      } catch (err) {
        showErrorToast('Failed to update chat');
      }
    })();
  };

  const deleteChat = (projectId: string, chatId: string) => {
    setChatsByProject(prev => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: list.filter(c => c.id !== chatId) };
    });
    removeChatDetails(chatId);
    (async () => {
      try {
        await deleteChatApi(chatId);
        showSuccessToast('Chat deleted');
      } catch (err) {
        showErrorToast('Failed to delete chat');
      }
    })();
  };

  const value = useMemo<ChatContextValue>(() => ({
    chatsByProject,
    getChatDetails: getChatDetailsValue,
    createChat,
    updateChat,
    deleteChat,
    hydrateProjectChats,
    ensureProjectChatsLoaded,
    clearProjectChats,
  }), [chatsByProject]);

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
};

export function useChats() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChats must be used within ChatProvider');
  return ctx;
}


