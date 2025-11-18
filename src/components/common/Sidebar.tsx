import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjects } from '../../context/ProjectsContext';
import { useAuth } from '../../context/AuthContext';
import { useChats } from '../../context/ChatContext';
import { ProjectRole, canCreateProjectChats, canManageProject } from '../../utils/permissions';
import EditChatModal from '../ui/EditChatModal';
import ProjectModal from '../ui/ProjectModal';
import DeleteProjectModal from '../ui/DeleteProjectModal';
import DeleteChatModal from '../ui/DeleteChatModal';
import logo from '../../assets/polaris_logo.png';

interface SidebarProps {
  open: boolean;
  isDesktop: boolean;
  onToggle: () => void;
}

// Component for project menu dropdown that uses the hook
interface ProjectMenuDropdownProps {
  projectId: string;
  menuDirection: 'up' | 'down';
  menuFocusIndex: number;
  focusMenuItem: (idx: number) => void;
  menuItemRefs: React.MutableRefObject<HTMLButtonElement | null>[];
  onEdit: () => void;
  onDelete: () => void;
  menuTriggerId: string;
  projectRole?: ProjectRole | null;
}

// Component for project menu button that conditionally shows based on permissions
interface ProjectMenuButtonProps {
  projectId: string;
  menuOpenForProject: string | null;
  setMenuOpenForProject: (id: string | null) => void;
  setMenuDirection: (dir: 'up' | 'down') => void;
  setMenuFocusIndex: (idx: number) => void;
  calculateMenuDirection: (el: HTMLElement) => 'up' | 'down';
  menuContainerRef: React.RefObject<HTMLDivElement | null>;
  menuTriggerRef: React.RefObject<HTMLButtonElement | null>;
  projectRole?: ProjectRole | null;
}

const ProjectMenuButton: React.FC<ProjectMenuButtonProps & { children?: React.ReactNode }> = ({
  projectId,
  menuOpenForProject,
  setMenuOpenForProject,
  setMenuDirection,
  setMenuFocusIndex,
  calculateMenuDirection,
  menuContainerRef,
  menuTriggerRef,
  projectRole,
  children,
}) => {
  const { t } = useTranslation();
  if (!canManageProject(projectRole)) return null;

  return (
    <div className="relative flex-shrink-0" ref={menuContainerRef}>
      <button
        ref={menuTriggerRef}
        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-200"
        aria-haspopup="menu"
        aria-expanded={menuOpenForProject === projectId}
        aria-controls={menuOpenForProject === projectId ? `project-menu-${projectId}` : undefined}
        id={`project-menu-trigger-${projectId}`}
        title={t('sidebar.projectOptions')}
        onClick={(e) => { 
          const direction = calculateMenuDirection(e.currentTarget);
          setMenuDirection(direction);
          setMenuOpenForProject(menuOpenForProject === projectId ? null : projectId); 
          setMenuFocusIndex(0); 
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a2 2 0 110 4 2 2 0 010-4zm0 5a2 2 0 110 4 2 2 0 010-4zm0 5a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
      </button>
      {children}
    </div>
  );
};

const ProjectMenuDropdown: React.FC<ProjectMenuDropdownProps> = ({
  projectId,
  menuDirection,
  menuFocusIndex,
  focusMenuItem,
  menuItemRefs,
  onEdit,
  onDelete,
  menuTriggerId,
  projectRole,
}) => {
  const { t } = useTranslation();
  if (!canManageProject(projectRole)) return null;

  return (
    <div
      id={`project-menu-${projectId}`}
      role="menu"
      aria-labelledby={menuTriggerId}
      className={`absolute right-0 w-40 bg-primary-50 text-gray-800 rounded-md overflow-hidden shadow-lg ring-1 ring-black/5 z-20 transform transition ease-out duration-150 ${
        menuDirection === 'up' 
          ? 'bottom-full mb-1 origin-bottom-right' 
          : 'top-full mt-1 origin-top-right'
      }`}
      onMouseDown={(e) => { e.stopPropagation(); }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); focusMenuItem(menuFocusIndex + 1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); focusMenuItem(menuFocusIndex - 1); }
        if (e.key === 'Tab') { e.preventDefault(); focusMenuItem(menuFocusIndex + (e.shiftKey ? -1 : 1)); }
      }}
    >
      <button
        type="button"
        ref={menuItemRefs[0]}
        role="menuitem"
        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-200 hover:text-gray-900 focus:outline-none focus-visible:bg-primary-200"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
      >
        {t('common.edit')}
      </button>
      <button
        type="button"
        ref={menuItemRefs[1]}
        role="menuitem"
        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-primary-200 hover:text-red-700 focus:outline-none focus-visible:bg-primary-200"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        {t('common.delete')}
      </button>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  open,
  isDesktop,
  onToggle,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const selectedProjectId = (() => {
    const match = location.pathname.match(/^\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  })();
  const [localSidebarSearch, setLocalSidebarSearch] = React.useState('');
  const [sidebarSearchDidMount, setSidebarSearchDidMount] = React.useState(false);
  const [localProjectSearch, setLocalProjectSearch] = React.useState('');
  const [projectSearchDidMount, setProjectSearchDidMount] = React.useState(false);
  const [menuOpenForProject, setMenuOpenForProject] = React.useState<string | null>(null);
  const [menuDirection, setMenuDirection] = React.useState<'down' | 'up'>('down');
  const [deleteProjectId, setDeleteProjectId] = React.useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = React.useState(false);
  const [projectModalMode, setProjectModalMode] = React.useState<'create' | 'edit'>('create');
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null);
  const [isSubmittingChat, setIsSubmittingChat] = React.useState(false);
  const [chatMenuOpenId, setChatMenuOpenId] = React.useState<string | null>(null);
  const [chatMenuDirection, setChatMenuDirection] = React.useState<'down' | 'up'>('down');
  const [chatEditId, setChatEditId] = React.useState<string | null>(null);
  const [chatDeleteId, setChatDeleteId] = React.useState<string | null>(null);

  // Ref for the scrollable container
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const {
    projects,
    sidebarProjects,
    sidebarLoading,
    sidebarHasMore,
    sidebarProjectSearchQuery,
    setSidebarProjectSearchQuery,
    loadMoreSidebarProjects,
    deleteProject,
    beginEditProject,
  } = useProjects();
  const {
    sidebarChatsByProject,
    loadingSidebarProjects, 
    createChat,
    deleteChat, 
    sidebarSearchQuery, 
    setSidebarSearchQuery, 
    ensureSidebarChatsLoaded,
    sidebarChatsHasMore,
    loadMoreSidebarChats,
    setSidebarCurrentPage,
  } = useChats();
  const navigate = useNavigate();

  const conversations = selectedProjectId ? (sidebarChatsByProject[selectedProjectId] || []) : [];
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(p => p.id === selectedProjectId) || sidebarProjects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects, sidebarProjects]);
  const projectRole = selectedProject?.user_role ?? null;

  // Initialize local project search from context once to avoid initial no-op debounce
  useEffect(() => {
    if (!projectSearchDidMount) {
      setLocalProjectSearch(sidebarProjectSearchQuery || '');
      setProjectSearchDidMount(true);
    }
  }, [projectSearchDidMount, sidebarProjectSearchQuery]);

  // Debounced project search effect with guard to avoid redundant updates
  useEffect(() => {
    if (!projectSearchDidMount) return; // skip first render
    const timer = setTimeout(() => {
      if (localProjectSearch !== sidebarProjectSearchQuery) {
        setSidebarProjectSearchQuery(localProjectSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localProjectSearch, sidebarProjectSearchQuery, setSidebarProjectSearchQuery, projectSearchDidMount]);

  // Initialize local sidebar search from context once to avoid initial no-op debounce
  useEffect(() => {
    if (!sidebarSearchDidMount) {
      setLocalSidebarSearch(sidebarSearchQuery || '');
      setSidebarSearchDidMount(true);
    }
  }, [sidebarSearchDidMount, sidebarSearchQuery]);

  // Debounced sidebar search effect with guard to avoid redundant updates
  useEffect(() => {
    if (!sidebarSearchDidMount) return; // skip first render
    const timer = setTimeout(() => {
      if (localSidebarSearch !== sidebarSearchQuery) {
        setSidebarSearchQuery(localSidebarSearch);
        setSidebarCurrentPage(1); // Reset to first page when searching
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSidebarSearch, sidebarSearchQuery, setSidebarSearchQuery, sidebarSearchDidMount]);

  // Load sidebar chats when search query changes
  useEffect(() => {
    if (selectedProjectId) {
      ensureSidebarChatsLoaded(selectedProjectId);
    }
  }, [sidebarSearchQuery, selectedProjectId]);

  // Scroll to selected project when it changes (e.g., when navigating from projects page)
  useEffect(() => {
    if (selectedProjectId && scrollContainerRef.current) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        // Find the project element in the sidebar
        const projectElement = document.querySelector(`[data-project-id="${selectedProjectId}"]`);
        if (projectElement && scrollContainerRef.current) {
          // Calculate if the element is visible in the scroll container
          const container = scrollContainerRef.current;
          const containerRect = container.getBoundingClientRect();
          const elementRect = projectElement.getBoundingClientRect();
          
          // Check if element is not fully visible
          const isElementAbove = elementRect.top < containerRect.top;
          const isElementBelow = elementRect.bottom > containerRect.bottom;
          
          if (isElementAbove || isElementBelow) {
            // Scroll the element into view with some padding
            projectElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedProjectId]);

  // Listen to external request to open create modal (from ProjectsList button)
  useEffect(() => {
    const handler = () => openCreate();
    window.addEventListener('sidebar:create-project', handler as any);
    return () => window.removeEventListener('sidebar:create-project', handler as any);
  }, []);

  // Accessibility: close any open project menu on outside click or Escape
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  
  // Simple approach - no refs needed for basic modal functionality
  useEffect(() => {
    if (!menuOpenForProject) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuContainerRef.current && !menuContainerRef.current.contains(target) && menuTriggerRef.current && !menuTriggerRef.current.contains(target)) {
        setMenuOpenForProject(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpenForProject(null);
        // return focus to trigger after closing
        setTimeout(() => menuTriggerRef.current?.focus(), 0);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpenForProject]);

  // Close chat menu on outside click or Escape key
  useEffect(() => {
    if (!chatMenuOpenId) return;
    
    const handleOutsideClick = (e: MouseEvent) => {
      // Check if click is outside any chat menu
      const target = e.target as Element;
      const isInsideChatMenu = target.closest('[data-chat-menu]');
      if (!isInsideChatMenu) {
        setChatMenuOpenId(null);
      }
    };
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setChatMenuOpenId(null);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [chatMenuOpenId]);

  // Keyboard navigation inside menu
  const [menuFocusIndex, setMenuFocusIndex] = useState(0);
  const menuItemRefs = [useRef<HTMLButtonElement | null>(null), useRef<HTMLButtonElement | null>(null)];
  const focusMenuItem = (idx: number) => {
    const clamped = Math.max(0, Math.min(1, idx));
    setMenuFocusIndex(clamped);
    setTimeout(() => menuItemRefs[clamped].current?.focus(), 0);
  };

  const calculateMenuDirection = (triggerElement: HTMLElement) => {
    const sidebar = document.querySelector('#app-sidebar');
    if (!sidebar) return 'down';
    
    const triggerRect = triggerElement.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    const menuHeight = 100; // Account for padding and shadows
    
    // Account for potential padding/margins in the sidebar
    const sidebarPadding = 16;
    const usableSpaceBelow = sidebarRect.bottom - triggerRect.bottom - sidebarPadding;
    const usableSpaceAbove = triggerRect.top - sidebarRect.top - sidebarPadding;
    
    // If we're in bottom 30% of sidebar, flip upward
    const sidebarHeight = sidebarRect.bottom - sidebarRect.top;
    const triggerPositionInSidebar = (triggerRect.top - sidebarRect.top) / sidebarHeight;
    const isNearBottom = triggerPositionInSidebar > 0.7; // Bottom 30%
    
    if ((usableSpaceBelow < menuHeight || isNearBottom) && usableSpaceAbove >= menuHeight) {
      return 'up';
    }
    
    return 'down';
  };

  const openCreate = () => {
    setProjectModalMode('create');
    setEditingProjectId(null);
    setShowProjectModal(true);
  };

  const openEdit = (projectId: string) => {
    beginEditProject(projectId);
    setProjectModalMode('edit');
    setEditingProjectId(projectId);
    setShowProjectModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    const success = await deleteProject(projectId);
    if (success && selectedProjectId === projectId) navigate('/projects');
  };

  const handleDeleteChat = async (projectId: string, chatId: string) => {
    const success = await deleteChat(projectId, chatId);
    if (success) {
      // Navigate to project page if we deleted the current chat
      const currentPath = window.location.pathname;
      if (currentPath.includes(`/chat/${chatId}`)) {
        navigate(`/projects/${projectId}`);
      }
    }
  };


  const openEditChat = (chatId: string) => {
    setChatEditId(chatId);
  };
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2 }}
            className={`bg-dark-300 text-white w-64 flex-shrink-0 fixed md:relative inset-y-0 left-0 h-screen z-30 flex flex-col overflow-hidden`}
            role={!isDesktop ? 'dialog' : undefined}
            aria-modal={!isDesktop ? true : undefined}
            aria-label="Sidebar navigation"
            id="app-sidebar"
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                {/* <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/projects')}>Polaris</h1> */}
                <img src={logo} alt="Polaris" className='w-30 h-12 cursor-pointer' onClick={() => navigate('/projects')} />
                <button 
                  onClick={onToggle}
                  className="md:hidden text-gray-400 hover:text-white"
                  aria-label="Close sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <Link to="/projects" className="text-sm uppercase tracking-wide text-gray-400">{t('sidebar.projects')}</Link>
              <div className="my-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="relative flex-1 mr-2">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder={t('sidebar.searchProjects')}
                      className="block w-full pl-8 pr-2 py-1.5 text-sm rounded-md bg-dark-200 text-gray-200 placeholder-gray-400 border border-dark-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={localProjectSearch}
                      onChange={(e) => setLocalProjectSearch(e.target.value)}
                    />
                  </div>
                  {user?.role === 'owner' && (
                    <button
                      onClick={openCreate}
                      className="p-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white flex-shrink-0"
                      title={t('sidebar.newProject')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div 
                ref={scrollContainerRef}
                style={{ height: 'calc(100vh - 280px)', overflowY: 'auto', scrollbarWidth: 'none' }}
              >
                <ul className="space-y-3">
                {sidebarProjects.map((p) => (
                  <li key={p.id} data-project-id={p.id}>
                    <div className="flex items-center gap-2 min-w-0">
                      <NavLink
                        to={`/projects/${p.id}`}
                        className={({ isActive }) =>
                          `flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm min-w-0 transition-colors duration-200 ${
                            isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-200 hover:text-white'
                          }`
                        }
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 6a2 2 0 012-2h3.5a1 1 0 01.8.4l.9 1.2H16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="truncate min-w-0" title={p.name}>{p.name}</span>
                      </NavLink>
                      <ProjectMenuButton
                        projectId={p.id}
                        menuOpenForProject={menuOpenForProject}
                        setMenuOpenForProject={setMenuOpenForProject}
                        setMenuDirection={setMenuDirection}
                        setMenuFocusIndex={setMenuFocusIndex}
                        calculateMenuDirection={calculateMenuDirection}
                        menuContainerRef={menuContainerRef}
                        menuTriggerRef={menuTriggerRef}
                        projectRole={p.user_role ?? null}
                      >
                        {menuOpenForProject === p.id && (
                          <ProjectMenuDropdown
                            projectId={p.id}
                            menuDirection={menuDirection}
                            menuFocusIndex={menuFocusIndex}
                            focusMenuItem={focusMenuItem}
                            menuItemRefs={menuItemRefs}
                            onEdit={() => { openEdit(p.id); setMenuOpenForProject(null); }}
                            onDelete={() => { setDeleteProjectId(p.id); setMenuOpenForProject(null); }}
                            menuTriggerId={`project-menu-trigger-${p.id}`}
                            projectRole={p.user_role ?? null}
                          />
                        )}
                      </ProjectMenuButton>
                    </div>

                    {selectedProjectId === p.id && (
                      <div className='border-l border-primary-600 ml-1'>
                        <div className="mt-2 px-3 space-y-2">
                          {/* Search input - always visible */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md bg-dark-200 text-gray-200 placeholder-gray-400 border border-dark-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              placeholder={t('sidebar.searchChats')}
                              value={localSidebarSearch}
                              onChange={(e) => setLocalSidebarSearch(e.target.value)}
                            />
                          </div>
                          
                          {/* New Chat button - only for owner or editor */}
                          {canCreateProjectChats(projectRole) && (
                            <button
                              className="w-full px-3 py-2 text-sm text-gray-200 font-medium hover:text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              disabled={isSubmittingChat}
                              onClick={async () => { 
                                if (!selectedProjectId) return;
                                setIsSubmittingChat(true);
                                try {
                                  const cid = await createChat(selectedProjectId, 'New Chat', '');
                                  navigate(`/projects/${selectedProjectId}/chat/${cid}`);
                                } catch {
                                  // Error handled in context
                                } finally {
                                  setIsSubmittingChat(false);
                                }
                              }}
                            >
                            {isSubmittingChat ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('common.creating')}
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                {t('sidebar.newChat')}
                              </>
                            )}
                            </button>
                          )}
                        </div>

                        <ul className="mt-2 space-y-1 pl-3">
                          {loadingSidebarProjects.has(p.id) ? (
                            <li className="py-2 text-sm text-gray-400 flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              {t('sidebar.loadingConversations')}
                            </li>
                          ) : conversations.map((c) => (
                              <li key={c.id}>
                                <div className="flex items-center gap-2">
                                  <NavLink
                                    to={`/projects/${selectedProjectId}/chat/${c.id}`}
                                    className={({ isActive }) =>
                                      `flex-1 block px-3 py-2 rounded-md text-sm truncate transition-colors duration-200 ${
                                        isActive ? 'text-white shadow-sm border border-primary-600' : 'text-gray-300 hover:bg-dark-200 hover:text-white'
                                      }`
                                    }
                                    title={c.title}
                                  >
                                    {c.title}
                                  </NavLink>
                                  {/* Chat menu - only show if role is loaded and user has permissions */}
                                  {canCreateProjectChats(projectRole) && (
                                    <div className="relative" data-chat-menu>
                                      <button
                                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-200"
                                        title={t('sidebar.chatOptions')}
                                        onClick={(e) => { 
                                          const direction = calculateMenuDirection(e.currentTarget);
                                          setChatMenuDirection(direction);
                                          setChatMenuOpenId(prev => prev === c.id ? null : c.id); 
                                        }}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 3a2 2 0 110 4 2 2 0 010-4zm0 5a2 2 0 110 4 2 2 0 010-4zm0 5a2 2 0 110 4 2 2 0 010-4z" />
                                        </svg>
                                      </button>
                                    {chatMenuOpenId === c.id && (
                                      <div className={`absolute right-0 w-40 bg-primary-50 text-gray-800 rounded-md overflow-hidden shadow-lg ring-1 ring-black/5 z-20 transform transition ease-out duration-150 ${
                                        chatMenuDirection === 'up' 
                                          ? 'bottom-full mb-1 origin-bottom-right' 
                                          : 'top-full mt-1 origin-top-right'
                                      }`}>
                                        {(projectRole === 'owner' || projectRole === 'editor') && (
                                          <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-200"
                                            onClick={() => { openEditChat(c.id); setChatMenuOpenId(null); }}
                                          >
                                            {t('common.edit')}
                                          </button>
                                        )}
                                        {canManageProject(projectRole) && (
                                          <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-primary-200 hover:text-red-700"
                                            onClick={() => { setChatDeleteId(c.id); setChatMenuOpenId(null); }}
                                          >
                                            {t('common.delete')}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                        </ul>
                        
                        {/* Load More Chats Button */}
                        {sidebarChatsHasMore && !sidebarSearchQuery && selectedProjectId === p.id && (
                          <div className="mt-2 pl-3">
                            <button
                              onClick={() => loadMoreSidebarChats(p.id)}
                              disabled={loadingSidebarProjects.has(p.id)}
                              className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-200 rounded-md border border-dark-200 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingSidebarProjects.has(p.id) ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  {t('common.loading')}
                                </div>
                              ) : (
                                t('sidebar.loadMoreChats')
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
                </ul>
                
                {/* Load More Button */}
                {sidebarHasMore && (
                  <div className="mt-4">
                    <button
                      onClick={loadMoreSidebarProjects}
                      disabled={sidebarLoading}
                      className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-200 rounded-md border border-dark-200 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sidebarLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                          {t('common.loading')}
                        </div>
                      ) : (
                        t('sidebar.loadMoreProjects')
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Profile Section */}
            {/* <div className="p-4 border-t border-gray-700 mt-auto">
              <div className="flex items-center min-w-0 gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user?.username || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
            </div> */}

          </motion.aside>
        )}
      </AnimatePresence>

      {open && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Project Modal (Create/Edit) */}
      {showProjectModal && (() => {
        const project = editingProjectId ? projects.find(p => p.id === editingProjectId) : null;
        return (
          <ProjectModal
            isOpen={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            mode={projectModalMode}
            projectId={editingProjectId || undefined}
            initialName={project?.name || ''}
            initialDescription={project?.description || ''}
          />
        );
      })()}

      {/* Delete Project Modal */}
      {deleteProjectId && (
        <DeleteProjectModal
          isOpen={true}
          onClose={() => setDeleteProjectId(null)}
          projectId={deleteProjectId}
          onConfirm={handleDeleteProject}
        />
      )}

      {/* Delete Chat Modal */}
      {chatDeleteId && selectedProjectId && (
        <DeleteChatModal
          isOpen={true}
          onClose={() => setChatDeleteId(null)}
          projectId={selectedProjectId}
          chatId={chatDeleteId}
          onConfirm={handleDeleteChat}
        />
      )}

      {/* Edit Chat Modal */}
      {chatEditId && selectedProjectId && (() => {
        const chat = conversations.find(c => c.id === chatEditId);
        if (!chat) return null;
        return (
          <EditChatModal
            isOpen={true}
            onClose={() => setChatEditId(null)}
            projectId={selectedProjectId}
            chatId={chatEditId}
            initialTitle={chat.title}
            initialDetails={chat.details}
          />
        );
      })()}
    </>
  );
};

export default Sidebar;


