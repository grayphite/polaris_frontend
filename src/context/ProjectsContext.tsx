import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProjectDetails, removeProjectDetails, seedProjectDetails, setProjectDetails } from '../services/projectsStorage';

export type Project = { id: string; name: string };
export type Conversation = { id: string; title: string };

type ProjectsContextValue = {
  projects: Project[];
  conversationsByProject: Record<string, Conversation[]>;
  getDetails: (projectId: string) => string;
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
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Marketing Campaign' },
    { id: '2', name: 'Product Roadmap' },
    { id: '3', name: 'Customer Research' },
  ]);

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

  // Seed demo details once
  useEffect(() => {
    seedProjectDetails({
      '1': 'Q4 marketing strategy and content planning for the new product launch. This project includes all marketing materials, social media strategy, and PR planning.',
      '2': 'Feature planning and prioritization for next quarter across product areas.',
      '3': 'Analysis of customer feedback and market trends to inform roadmap.',
    });
  }, []);

  const [openCreateProject, setOpenCreateProject] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);

  const getDetails = (projectId: string) => getProjectDetails(projectId);

  const createProject = (name: string, details: string) => {
    const id = Date.now().toString();
    setProjects(prev => [{ id, name }, ...prev]);
    setConversationsByProject(prev => ({ ...prev, [id]: [] }));
    setProjectDetails(id, details);
    return id;
  };

  const updateProject = (projectId: string, name: string, details: string) => {
    setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, name } : p)));
    setProjectDetails(projectId, details);
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setConversationsByProject(prev => {
      const { [projectId]: _removed, ...rest } = prev;
      return rest;
    });
    removeProjectDetails(projectId);
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


