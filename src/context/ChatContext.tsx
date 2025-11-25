import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react';
import { showErrorToast } from '../utils/toast';
import { createChatApi, deleteChatApi, fetchChats, updateChatApi } from '../services/chatService';

export type Chat = { 
  id: string; 
  projectId: string; 
  title: string; 
  details?: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
};

type ChatContextValue = {
  chatsByProject: Record<string, Chat[]>;
  sidebarChatsByProject: Record<string, Chat[]>;
  loadingProjects: Set<string>;
  loadingSidebarProjects: Set<string>;
  createChat: (projectId: string, name: string, description?: string) => Promise<string>; // returns real id
  updateChat: (projectId: string, chatId: string, name: string, description: string) => void;
  deleteChat: (projectId: string, chatId: string) => Promise<boolean>;
  hydrateProjectChats: (projectId: string, chats: Array<{ id: string; title: string; details?: string }>, replace?: boolean) => void;
  hydrateSidebarChats: (projectId: string, chats: Array<{ id: string; title: string; details?: string }>, replace?: boolean, append?: boolean) => void;
  ensureProjectChatsLoaded: (projectId: string) => Promise<void>;
  ensureSidebarChatsLoaded: (projectId: string) => Promise<void>;
  ensureInitialChatsLoaded: (projectId: string) => Promise<void>;
  clearProjectChats: (projectId: string) => void;
  // Search and pagination state
  sidebarSearchQuery: string;
  setSidebarSearchQuery: (query: string) => void;
  conversationsSearchQuery: string;
  setConversationsSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pagination: {
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    pages: number;
    per_page?: number;
    total?: number;
    success?: boolean;
  } | null;
  setPagination: (pagination: any) => void;
  // Sidebar pagination
  sidebarCurrentPage: number;
  setSidebarCurrentPage: (page: number) => void;
  sidebarChatsHasMore: boolean;
  setSidebarChatsHasMore: (hasMore: boolean) => void;
  loadMoreSidebarChats: (projectId: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatsByProject, setChatsByProject] = useState<Record<string, Chat[]>>({});
  const [sidebarChatsByProject, setSidebarChatsByProject] = useState<Record<string, Chat[]>>({});
  const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set());
  const [loadingSidebarProjects, setLoadingSidebarProjects] = useState<Set<string>>(new Set());
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [conversationsSearchQuery, setConversationsSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    pages: number;
    per_page?: number;
    total?: number;
    success?: boolean;
  } | null>(null);
  const [sidebarCurrentPage, setSidebarCurrentPage] = useState(1);
  const [sidebarChatsHasMore, setSidebarChatsHasMore] = useState(false);
  
  // Use ref to access current sidebarSearchQuery without causing dependency issues
  const sidebarSearchQueryRef = useRef(sidebarSearchQuery);
  sidebarSearchQueryRef.current = sidebarSearchQuery;


  const hydrateProjectChats = useCallback((projectId: string, chats: Array<{ 
    id: string; 
    title: string; 
    details?: string;
    created_at?: string;
    updated_at?: string;
    message_count?: number;
  }>, replace: boolean = false) => {
    if (!Array.isArray(chats)) return;
    
    setChatsByProject(prev => {
      if (replace || conversationsSearchQuery) {
        // For search results or explicit replace, completely replace the chats
        return { 
          ...prev, 
          [projectId]: chats.map(c => ({ 
            id: c.id, 
            projectId, 
            title: c.title, 
            details: c.details,
            created_at: c.created_at,
            updated_at: c.updated_at,
            message_count: c.message_count
          }))
        };
      } else {
        // For normal loading, merge by id, prefer incoming
        const current = prev[projectId] || [];
        const byId: Record<string, Chat> = {};
        [...current, ...chats.map(c => ({ 
          id: c.id, 
          projectId, 
          title: c.title, 
          details: c.details,
          created_at: c.created_at,
          updated_at: c.updated_at,
          message_count: c.message_count
        }))].forEach(c => { byId[c.id] = c; });
        return { ...prev, [projectId]: Object.values(byId) };
      }
    });
  }, [conversationsSearchQuery]);

  const hydrateSidebarChats = useCallback((projectId: string, chats: Array<{ 
    id: string; 
    title: string; 
    details?: string;
    created_at?: string;
    updated_at?: string;
    message_count?: number;
  }>, replace: boolean = false, append: boolean = false) => {
    if (!Array.isArray(chats)) return;
    
    setSidebarChatsByProject(prev => {
      if (replace || sidebarSearchQuery || append) {
        // For search results, explicit replace, or load more, completely replace the chats
        if (append) {
          // For load more, append to existing chats
          const current = prev[projectId] || [];
          const newChats = chats.map(c => ({ 
            id: c.id, 
            projectId, 
            title: c.title, 
            details: c.details,
            created_at: c.created_at,
            updated_at: c.updated_at,
            message_count: c.message_count
          }));
          return { ...prev, [projectId]: [...current, ...newChats] };
        } else {
          // For search results or explicit replace, completely replace the chats
          return { 
            ...prev, 
            [projectId]: chats.map(c => ({ 
              id: c.id, 
              projectId, 
              title: c.title, 
              details: c.details,
              created_at: c.created_at,
              updated_at: c.updated_at,
              message_count: c.message_count
            }))
          };
        }
      } else {
        // For normal loading, merge by id, prefer incoming
        const current = prev[projectId] || [];
        const byId: Record<string, Chat> = {};
        [...current, ...chats.map(c => ({ 
          id: c.id, 
          projectId, 
          title: c.title, 
          details: c.details,
          created_at: c.created_at,
          updated_at: c.updated_at,
          message_count: c.message_count
        }))].forEach(c => { byId[c.id] = c; });
        return { ...prev, [projectId]: Object.values(byId) };
      }
    });
  }, [sidebarSearchQuery]);

  const ensureProjectChatsLoaded = useCallback(async (projectId: string) => {
    if (!projectId) return;
    
    let shouldFetch = true;
    setLoadingProjects(prev => {
      if (prev.has(projectId)) {
        shouldFetch = false;
        return prev;
      }
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
    
    if (!shouldFetch) return;
    
    try {
      const response = await fetchChats(projectId, currentPage, 4, conversationsSearchQuery);
      if (response && response.chats) {
        hydrateProjectChats(projectId, response.chats.map(r => ({ 
          id: r.id.toString(), 
          title: r.name, 
          details: r.description,
          created_at: r.created_at,
          updated_at: r.updated_at,
          message_count: r.aichat_count ?? 0
        })), true); // Always replace when fetching from API
        setPagination(response.pagination);
      } else {
        // Set empty array if no data returned
        setChatsByProject(prev => ({ ...prev, [projectId]: [] }));
        setPagination(null);
      }
    } catch (error) {
      console.warn('Failed to load chats for project:', projectId, error);
      // Set empty array to prevent repeated failed requests
      setChatsByProject(prev => ({ ...prev, [projectId]: [] }));
      setPagination(null);
    } finally {
      setLoadingProjects(prev => {
        if (!prev.has(projectId)) return prev;
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  }, [currentPage, conversationsSearchQuery, hydrateProjectChats]);

  const ensureInitialChatsLoaded = useCallback(async (projectId: string) => {
    if (!projectId) return;
    
    let shouldFetch = true;
    setLoadingProjects(prev => {
      if (prev.has(projectId)) {
        shouldFetch = false;
        return prev;
      }
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
    
    if (!shouldFetch) return;
    
    try {
      // Load initial 4 chats without search for initial load
      const response = await fetchChats(projectId, 1, 4, '');
      if (response && response.chats) {
        const mappedChats = response.chats.map(r => ({ 
          id: r.id.toString(), 
          title: r.name, 
          details: r.description,
          created_at: r.created_at,
          updated_at: r.updated_at,
          message_count: r.aichat_count ?? 0
        }));
        
        // Load into both data sources for initial display
        hydrateProjectChats(projectId, mappedChats, true);
        hydrateSidebarChats(projectId, mappedChats, true);
        setPagination(response.pagination);
        
        // Set sidebar pagination state
        setSidebarCurrentPage(1);
        setSidebarChatsHasMore(response.pagination?.has_next || false);
      } else {
        // Set empty array if no data returned
        setChatsByProject(prev => ({ ...prev, [projectId]: [] }));
        setSidebarChatsByProject(prev => ({ ...prev, [projectId]: [] }));
        setPagination(null);
      }
    } catch (error) {
      console.warn('Failed to load initial chats for project:', projectId, error);
      // Set empty array to prevent repeated failed requests
      setChatsByProject(prev => ({ ...prev, [projectId]: [] }));
      setSidebarChatsByProject(prev => ({ ...prev, [projectId]: [] }));
      setPagination(null);
    } finally {
      setLoadingProjects(prev => {
        if (!prev.has(projectId)) return prev;
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  }, [hydrateProjectChats, hydrateSidebarChats]);

  const ensureSidebarChatsLoaded = useCallback(async (projectId: string) => {
    if (!projectId) return;
    
    let shouldFetch = true;
    setLoadingSidebarProjects(prev => {
      if (prev.has(projectId)) {
        shouldFetch = false;
        return prev;
      }
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
    
    if (!shouldFetch) return;
    
    try {
      const response = await fetchChats(projectId, 1, 4, sidebarSearchQueryRef.current); // Use page 1 and limit 4 for sidebar
      if (response && response.chats) {
        hydrateSidebarChats(projectId, response.chats.map(r => ({ 
          id: r.id.toString(), 
          title: r.name, 
          details: r.description,
          created_at: r.created_at,
          updated_at: r.updated_at,
          message_count: r.aichat_count ?? 0
        })), true); // Always replace when fetching from API
        
        // Update sidebar pagination state
        setSidebarCurrentPage(1);
        setSidebarChatsHasMore(response.pagination?.has_next || false);
      } else {
        // Set empty array if no data returned
        setSidebarChatsByProject(prev => ({ ...prev, [projectId]: [] }));
        setSidebarChatsHasMore(false);
      }
    } catch (error) {
      console.warn('Failed to load sidebar chats for project:', projectId, error);
      // Set empty array to prevent repeated failed requests
      setSidebarChatsByProject(prev => ({ ...prev, [projectId]: [] }));
      setSidebarChatsHasMore(false);
    } finally {
      setLoadingSidebarProjects(prev => {
        if (!prev.has(projectId)) return prev;
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  }, [hydrateSidebarChats, setSidebarCurrentPage, setSidebarChatsHasMore]);

  const loadMoreSidebarChats = async (projectId: string) => {
    if (!sidebarChatsHasMore || loadingSidebarProjects.has(projectId)) return;
    
    setLoadingSidebarProjects(prev => new Set(prev).add(projectId));
    
    try {
      const nextPage = sidebarCurrentPage + 1;
      const response = await fetchChats(projectId, nextPage, 4, sidebarSearchQuery); // Load 4 more chats
      if (response && response.chats) {
        if (response.chats.length > 0) {
          hydrateSidebarChats(projectId, response.chats.map(r => ({ 
            id: r.id.toString(), 
            title: r.name, 
            details: r.description,
            created_at: r.created_at,
            updated_at: r.updated_at,
            message_count: r.aichat_count ?? 0
          })), false, true); // Append to existing chats
          
          // Update sidebar pagination state
          setSidebarCurrentPage(nextPage);
          setSidebarChatsHasMore(response.pagination?.has_next || false);
        } else {
          // No more chats available
          setSidebarChatsHasMore(false);
        }
      } else {
        setSidebarChatsHasMore(false);
      }
    } catch (error) {
      console.warn('Failed to load more sidebar chats for project:', projectId, error);
      setSidebarChatsHasMore(false);
    } finally {
      setLoadingSidebarProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const clearProjectChats = (projectId: string) => {
    setChatsByProject(prev => {
      const { [projectId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const createChat = async (projectId: string, name: string, description: string = '') => {
    try {
      const created = await createChatApi(projectId, name, description);
      if (created?.id) {
        const newChat = {
          id: created.id.toString(),
          projectId,
          title: created.name || name,
          details: created.description || description,
          created_at: created.created_at,
          updated_at: created.created_at,
          message_count: 0,
        };
        
        // Update both conversations and sidebar chats
        setChatsByProject(prev => {
          const list = prev[projectId] || [];
          return {
            ...prev,
            [projectId]: [newChat, ...list],
          };
        });
        
        setSidebarChatsByProject(prev => {
          const list = prev[projectId] || [];
          return {
            ...prev,
            [projectId]: [newChat, ...list],
          };
        });
        
        // showSuccessToast('Chat created');
        return created.id.toString();
      }
      throw new Error('Invalid chat create response');
    } catch (err) {
      showErrorToast('Failed to create chat');
      throw err;
    }
  };

  const updateChat = (projectId: string, chatId: string, name: string, description: string) => {
    // Update both conversations and sidebar chats
    setChatsByProject(prev => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: list.map(c => (c.id === chatId ? { ...c, title: name, details: description } : c)) };
    });
    
    setSidebarChatsByProject(prev => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: list.map(c => (c.id === chatId ? { ...c, title: name, details: description } : c)) };
    });
    
    (async () => {
      try {
        await updateChatApi(chatId, name, description);
        // showSuccessToast('Chat Updated Successfully!');
      } catch (err) {
        showErrorToast('Failed to update chat');
      }
    })();
  };

  const deleteChat = async (projectId: string, chatId: string) => {
    try {
      await deleteChatApi(chatId);
      // Update both conversations and sidebar chats
      setChatsByProject(prev => {
        const list = prev[projectId] || [];
        return { ...prev, [projectId]: list.filter(c => c.id !== chatId) };
      });
      
      setSidebarChatsByProject(prev => {
        const list = prev[projectId] || [];
        return { ...prev, [projectId]: list.filter(c => c.id !== chatId) };
      });
      
      // showSuccessToast('Chat deleted');
      return true;
    } catch (err) {
      showErrorToast('Failed to delete chat');
      return false;
    }
  };

  const value = useMemo<ChatContextValue>(() => ({
    chatsByProject,
    sidebarChatsByProject,
    loadingProjects,
    loadingSidebarProjects,
    createChat,
    updateChat,
    deleteChat,
    hydrateProjectChats,
    hydrateSidebarChats,
    ensureProjectChatsLoaded,
    ensureSidebarChatsLoaded,
    ensureInitialChatsLoaded,
    clearProjectChats,
    sidebarSearchQuery,
    setSidebarSearchQuery,
    conversationsSearchQuery,
    setConversationsSearchQuery,
    currentPage,
    setCurrentPage,
    pagination,
    setPagination,
    sidebarCurrentPage,
    setSidebarCurrentPage,
    sidebarChatsHasMore,
    setSidebarChatsHasMore,
    loadMoreSidebarChats,
  }), [chatsByProject, sidebarChatsByProject, loadingProjects, loadingSidebarProjects, sidebarSearchQuery, conversationsSearchQuery, currentPage, pagination, sidebarCurrentPage, sidebarChatsHasMore]);

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
};

export function useChats() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChats must be used within ChatProvider');
  return ctx;
}


