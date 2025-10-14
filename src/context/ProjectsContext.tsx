import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProjectDetails, removeProjectDetails, seedProjectDetails, setProjectDetails } from '../services/projectsStorage';
import { createProjectApi, deleteProjectApi, fetchProjectById, fetchProjects, updateProjectApi } from '../services/projectService';
import { showErrorToast, showSuccessToast } from '../utils/toast';

export type Project = { id: string; name: string };
export type Conversation = { id: string; title: string };

type ProjectsContextValue = {
  projects: Project[];
  conversationsByProject: Record<string, Conversation[]>;
  getDetails: (projectId: string) => string;
  projectsLoading: boolean;
  createProject: (name: string, details: string) => string; // returns id
  updateProject: (projectId: string, name: string, details: string) => void;
  deleteProject: (projectId: string) => void;
  startConversation: (projectId: string, title: string) => string; // returns conversation id
  // UI flags for create/edit modal hosted in Sidebar
  openCreateProject: boolean;
  setOpenCreateProject: (v: boolean) => void;
  editProjectId: string | null;
  beginEditProject: (projectId: string) => void;
  endEditProject: () => void;
};

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Marketing Campaign' },
    { id: '2', name: 'Product Roadmap' },
    { id: '3', name: 'Customer Research' },
  ]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);

  const [conversationsByProject, setConversationsByProject] = useState<Record<string, Conversation[]>>({
    '1': [
      { id: '1', title: 'Social Media Strategy' },
      { id: '2', title: 'Email Campaign Planning' },
      { id: '3', title: 'Content Calendar' },
    ],
    '2': [
      { id: '4', title: 'Roadmap Q4' },
      { id: '5', title: 'Stakeholder Feedback' },
    ],
    '3': [
      { id: '6', title: 'Interview Notes' },
    ],
  });

  // Seed demo details once and attempt to load projects from API
  useEffect(() => {
    seedProjectDetails({
      '1': 'Q4 marketing strategy and content planning for the new product launch. This project includes all marketing materials, social media strategy, and PR planning.',
      '2': 'Feature planning and prioritization for next quarter across product areas.',
      '3': 'Analysis of customer feedback and market trends to inform roadmap.',
    });
    // Try loading projects from API; fall back to seeded list on failure
    (async () => {
      try {
        setProjectsLoading(true);
        const remote = await fetchProjects();
        if (Array.isArray(remote) && remote.length) {
          setProjects(remote.map(r => ({ id: r.id, name: r.name })));
          // If backend returns details, store them for detail consumers
          remote.forEach(r => { if (r.details) setProjectDetails(r.id, r.details!); });
        }
      } catch (err) {
        // Silent fallback; keep demo projects
        console.warn('Projects API not available, using demo data');
      } finally {
        setProjectsLoading(false);
      }
    })();
  }, []);

  // Ensure active project (from URL) is present and hydrated
  useEffect(() => {
    const match = location.pathname.match(/^\/projects\/([^\/]+)/);
    const activeId = match ? match[1] : null;
    if (!activeId) return;
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
            const present = prev.some(p => p.id === data.id);
            const next = present ? prev.map(p => (p.id === data.id ? { id: data.id, name: data.name || p.name } : p)) : [{ id: data.id, name: data.name || 'Project' }, ...prev];
            return next;
          });
          if (data.details) setProjectDetails(data.id, data.details);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          showErrorToast('Project not found');
          navigate('/projects');
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const [openCreateProject, setOpenCreateProject] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);

  const getDetails = (projectId: string) => getProjectDetails(projectId);

  const createProject = (name: string, details: string) => {
    const optimisticId = Date.now().toString();
    setProjects(prev => [{ id: optimisticId, name }, ...prev]);
    setConversationsByProject(prev => ({ ...prev, [optimisticId]: [] }));
    setProjectDetails(optimisticId, details);
    (async () => {
      try {
        const created = await createProjectApi(name, details);
        // Reconcile optimistic id with server id if different
        if (created?.id && created.id !== optimisticId) {
          setProjects(prev => prev.map(p => (p.id === optimisticId ? { id: created.id, name: created.name || name } : p)));
          setConversationsByProject(prev => {
            const list = prev[optimisticId] || [];
            const { [optimisticId]: _removed, ...rest } = prev;
            return { ...rest, [created.id]: list };
          });
          setProjectDetails(created.id, created.details || details);
          removeProjectDetails(optimisticId);
        }
        showSuccessToast('Project created');
      } catch (err) {
        showErrorToast('Failed to create project');
      }
    })();
    return optimisticId;
  };

  const updateProject = (projectId: string, name: string, details: string) => {
    setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, name } : p)));
    setProjectDetails(projectId, details);
    (async () => {
      try {
        await updateProjectApi(projectId, name, details);
        showSuccessToast('Project updated');
      } catch (err) {
        showErrorToast('Failed to update project');
      }
    })();
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setConversationsByProject(prev => {
      const { [projectId]: _removed, ...rest } = prev;
      return rest;
    });
    removeProjectDetails(projectId);
    (async () => {
      try {
        await deleteProjectApi(projectId);
        showSuccessToast('Project deleted');
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

  const value = useMemo<ProjectsContextValue>(() => ({
    projects,
    conversationsByProject,
    getDetails,
    projectsLoading,
    createProject,
    updateProject,
    deleteProject,
    startConversation,
    openCreateProject,
    setOpenCreateProject,
    editProjectId,
    beginEditProject,
    endEditProject,
  }), [projects, conversationsByProject, openCreateProject, editProjectId]);

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
};

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}


