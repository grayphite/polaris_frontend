import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChats } from './ChatContext';
import { createProjectApi, deleteProjectApi, fetchProjectById, fetchProjects, updateProjectApi } from '../services/projectService';
import { showErrorToast, showSuccessToast } from '../utils/toast';

export type Project = { id: string; name: string; description?: string; created_at?: string; updated_at?: string };
export type Conversation = { id: string; title: string };

type ProjectsContextValue = {
  projects: Project[];
  conversationsByProject: Record<string, Conversation[]>;
  projectsLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pagination: {
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    pages: number;
    per_page: number;
    total: number;
  } | null;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description: string) => Promise<string>; // returns id
  updateProject: (projectId: string, name: string, description: string) => void;
  deleteProject: (projectId: string) => void;
  startConversation: (projectId: string, title: string) => string; // returns conversation id
  // UI flags for create/edit modal hosted in Sidebar
  openCreateProject: boolean;
  setOpenCreateProject: (v: boolean) => void;
  editProjectId: string | null;
  beginEditProject: (projectId: string) => void;
  endEditProject: () => void;
  // Sidebar projects state
  sidebarProjects: Project[];
  sidebarLoading: boolean;
  sidebarHasMore: boolean;
  loadMoreSidebarProjects: () => Promise<void>;
};

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hydrateProjectChats, clearProjectChats } = useChats();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    pages: number;
    per_page: number;
    total: number;
  } | null>(null);

  const [conversationsByProject, setConversationsByProject] = useState<Record<string, Conversation[]>>({});

  // Sidebar projects state
  const [sidebarProjects, setSidebarProjects] = useState<Project[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState<boolean>(false);
  const [sidebarHasMore, setSidebarHasMore] = useState<boolean>(true);
  const [sidebarPage, setSidebarPage] = useState<number>(1);

  // Load projects function
  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await fetchProjects(currentPage, 10, searchQuery, false);
      setProjects(response.projects.map(r => ({ 
        id: r.id.toString(), 
        name: r.name,
        description: r.description,
        created_at: r.created_at,
        updated_at: r.updated_at
      })));
      setPagination(response.pagination);
      
      // Hydrate embedded chats when present
      response.projects.forEach(r => { 
        if (Array.isArray(r.chats) && r.chats.length) {
          hydrateProjectChats(r.id.toString(), r.chats!.map(c => ({ 
            id: c.id, 
            title: c.title, 
            details: c.details 
          }))); 
        }
      });
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load more sidebar projects function
  const loadMoreSidebarProjects = async () => {
    if (sidebarLoading || !sidebarHasMore) return;
    
    setSidebarLoading(true);
    try {
      const response = await fetchProjects(sidebarPage, 10, '', false);
      const newProjects = response.projects.map(r => ({ 
        id: r.id.toString(), 
        name: r.name,
        description: r.description,
        created_at: r.created_at,
        updated_at: r.updated_at
      }));
      
      setSidebarProjects(prev => [...prev, ...newProjects]);
      setSidebarPage(prev => prev + 1);
      setSidebarHasMore(response.pagination.has_next);
      
      // Hydrate embedded chats when present
      response.projects.forEach(r => { 
        if (Array.isArray(r.chats) && r.chats.length) {
          hydrateProjectChats(r.id.toString(), r.chats!.map(c => ({ 
            id: c.id, 
            title: c.title, 
            details: c.details 
          }))); 
        }
      });
    } catch (err) {
      console.error('Failed to load more sidebar projects:', err);
    } finally {
      setSidebarLoading(false);
    }
  };

  // Load projects on mount and when search/page changes
  useEffect(() => {
    loadProjects();
  }, [currentPage, searchQuery]);

  // Load initial sidebar projects on mount
  useEffect(() => {
    loadMoreSidebarProjects();
  }, []);

  // Ensure active project (from URL) is present and hydrated - only for project detail pages, not chat pages
  useEffect(() => {
    const match = location.pathname.match(/^\/projects\/([^\/]+)(?:\/|$)/);
    const activeId = match ? match[1] : null;
    const isProjectDetailPage = location.pathname === `/projects/${activeId}`;
    
    if (!activeId || !isProjectDetailPage) return;
    
    
    const exists = projects.some(p => p.id === activeId);
    if (!exists) {
      // add placeholder so sidebar highlights
      setProjects(prev => [{ id: activeId, name: 'Loading…' }, ...prev]);
    }
    // fetch its info
    (async () => {
      try {
        const data = await fetchProjectById(activeId);
        if (data?.id) {
          setProjects(prev => {
            const present = prev.some(p => p.id === data.id.toString());
            const next = present ? prev.map(p => (p.id === data.id.toString() ? { 
              id: data.id.toString(), 
              name: data.name || p.name,
              description: data.description || p.description
            } : p)) : [{ 
              id: data.id.toString(), 
              name: data.name || 'Project',
              description: data.description
            }, ...prev];
            return next;
          });
          if (Array.isArray((data as any).chats) && (data as any).chats.length) {
            const chats = (data as any).chats.map((c: any) => ({ id: c.id, title: c.title, details: c.details }));
            hydrateProjectChats(data.id.toString(), chats);
          }
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          showErrorToast('Project not found');
          // Remove the placeholder project that was added
          setProjects(prev => prev.filter(p => p.id !== activeId));
          navigate('/projects');
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const [openCreateProject, setOpenCreateProject] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);

  const createProject = async (name: string, description: string) => {
    try {
      const created = await createProjectApi(name, description);
      if (created?.id) {
        const realProject = { 
          id: created.id.toString(), 
          name: created.name || name,
          description: created.description || description,
          created_at: created.created_at,
          updated_at: created.updated_at
        };
        // Add the real project to state
        setProjects(prev => [realProject, ...prev]);
        setSidebarProjects(prev => [realProject, ...prev]);
        setConversationsByProject(prev => ({ ...prev, [created.id.toString()]: [] }));
        
        showSuccessToast('Project Created Successfully!');
        // Navigate to the real project ID
        navigate(`/projects/${created.id}`);
        return created.id.toString();
      }
      throw new Error('Invalid project create response');
    } catch (err) {
      showErrorToast('Failed to create project');
      throw err;
    }
  };

  const updateProject = (projectId: string, name: string, description: string) => {
    const updatedProject = { id: projectId, name, description, created_at: undefined, updated_at: undefined };
    setProjects(prev => prev.map(p => (p.id === projectId ? updatedProject : p)));
    setSidebarProjects(prev => prev.map(p => (p.id === projectId ? updatedProject : p))); // Also update sidebar
    (async () => {
      try {
        await updateProjectApi(projectId, name, description);
        showSuccessToast('Project Updated Successfully!');
      } catch (err) {
        showErrorToast('Failed to update project');
      }
    })();
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setSidebarProjects(prev => prev.filter(p => p.id !== projectId)); // Also remove from sidebar
    setConversationsByProject(prev => {
      const { [projectId]: _removed, ...rest } = prev;
      return rest;
    });
    clearProjectChats(projectId);
    (async () => {
      try {
        await deleteProjectApi(projectId);
        showSuccessToast('Project Deleted Successfully!');
      } catch (err) {
        showErrorToast('Failed to delete project');
      }
    })();
  };

  const startConversation = (projectId: string, title: string) => {
    const id = Date.now().toString();
    setConversationsByProject(prev => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: [{ id, title }, ...list] };
    });
    return id;
  };

  const beginEditProject = (projectId: string) => {
    setEditProjectId(projectId);
    setOpenCreateProject(true);
  };
  const endEditProject = () => {
    setEditProjectId(null);
    setOpenCreateProject(false);
  };

  // Custom setSearchQuery that also resets page to 1 when query actually changes
  const handleSetSearchQuery = (query: string) => {
    if (query === searchQuery) return; // no-op if nothing changed
    setSearchQuery(query);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const value = useMemo<ProjectsContextValue>(() => ({
    projects,
    conversationsByProject,
    projectsLoading,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    currentPage,
    setCurrentPage,
    pagination,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    startConversation,
    openCreateProject,
    setOpenCreateProject,
    editProjectId,
    beginEditProject,
    endEditProject,
    sidebarProjects,
    sidebarLoading,
    sidebarHasMore,
    loadMoreSidebarProjects,
  }), [projects, conversationsByProject, projectsLoading, searchQuery, currentPage, pagination, openCreateProject, editProjectId, sidebarProjects, sidebarLoading, sidebarHasMore, loadMoreSidebarProjects]);

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
};

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}


