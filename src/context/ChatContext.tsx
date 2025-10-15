import React, { createContext, useContext, useMemo, useState } from 'react';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { createChatApi, deleteChatApi, fetchChats, updateChatApi } from '../services/chatService';

export type Chat = { id: string; projectId: string; title: string; details?: string };

type ChatContextValue = {
  chatsByProject: Record<string, Chat[]>;
  createChat: (projectId: string, title: string, details: string) => Promise<string>; // returns real id
  updateChat: (projectId: string, chatId: string, title: string, details: string) => void;
  deleteChat: (projectId: string, chatId: string) => void;
  hydrateProjectChats: (projectId: string, chats: Array<{ id: string; title: string; details?: string }>) => void;
  ensureProjectChatsLoaded: (projectId: string) => Promise<void>;
  clearProjectChats: (projectId: string) => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatsByProject, setChatsByProject] = useState<Record<string, Chat[]>>({});


  const hydrateProjectChats = (projectId: string, chats: Array<{ id: string; title: string; details?: string }>) => {
    if (!Array.isArray(chats) || chats.length === 0) return;
    setChatsByProject(prev => {
      const current = prev[projectId] || [];
      // merge by id, prefer incoming
      const byId: Record<string, Chat> = {};
      [...current, ...chats.map(c => ({ id: c.id, projectId, title: c.title, details: c.details }))].forEach(c => { byId[c.id] = c; });
      return { ...prev, [projectId]: Object.values(byId) };
    });
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

  const createChat = async (projectId: string, title: string, details: string) => {
    try {
      const created = await createChatApi(projectId, title, details);
      if (created?.id) {
        setChatsByProject(prev => {
          const list = prev[projectId] || [];
          return {
            ...prev,
            [projectId]: [
              {
                id: created.id.toString(),
                projectId,
                title: created.title || title,
                details: created.details || details,
              },
              ...list,
            ],
          };
        });
        showSuccessToast('Chat created');
        return created.id.toString();
      }
      throw new Error('Invalid chat create response');
    } catch (err) {
      showErrorToast('Failed to create chat');
      throw err;
    }
  };

  const updateChat = (projectId: string, chatId: string, title: string, details: string) => {
    setChatsByProject(prev => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: list.map(c => (c.id === chatId ? { ...c, title, details } : c)) };
    });
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


