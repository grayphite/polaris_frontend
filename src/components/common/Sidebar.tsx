import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectsContext';
import { useAuth } from '../../context/AuthContext';
import { useChats } from '../../context/ChatContext';

interface SidebarProps {
  open: boolean;
  isDesktop: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  isDesktop,
  onToggle,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const selectedProjectId = (() => {
    const match = location.pathname.match(/^\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  })();
  const [searchProjectId, setSearchProjectId] = React.useState<string | null>(null);
  const [projectSearch, setProjectSearch] = React.useState('');
  const [menuOpenForProject, setMenuOpenForProject] = React.useState<string | null>(null);
  const [menuDirection, setMenuDirection] = React.useState<'down' | 'up'>('down');
  const [deleteProjectId, setDeleteProjectId] = React.useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDetails, setNewProjectDetails] = React.useState('');
  const [isEditingProject, setIsEditingProject] = React.useState(false);
  const [showCreateChat, setShowCreateChat] = React.useState(false);
  const [newChatName, setNewChatName] = React.useState('');
  const [newChatDetails, setNewChatDetails] = React.useState('');
  const [isSubmittingChat, setIsSubmittingChat] = React.useState(false);
  const [chatMenuOpenId, setChatMenuOpenId] = React.useState<string | null>(null);
  const [chatEditId, setChatEditId] = React.useState<string | null>(null);
  const [chatEditTitle, setChatEditTitle] = React.useState('');
  const [chatEditDetails, setChatEditDetails] = React.useState('');
  const [chatDeleteId, setChatDeleteId] = React.useState<string | null>(null);

  const {
    projects,
    sidebarProjects,
    sidebarLoading,
    sidebarHasMore,
    loadMoreSidebarProjects,
    conversationsByProject,
    createProject,
    updateProject,
    deleteProject,
    beginEditProject,
    editProjectId,
    endEditProject,
  } = useProjects();
  const { chatsByProject, createChat, updateChat, deleteChat } = useChats();
  const navigate = useNavigate();

  const conversations = selectedProjectId ? (chatsByProject[selectedProjectId] || []) : [];

  // Listen to external request to open create modal (from ProjectsList button)
  React.useEffect(() => {
    const handler = () => openCreate();
    window.addEventListener('sidebar:create-project', handler as any);
    return () => window.removeEventListener('sidebar:create-project', handler as any);
  }, []);

  // Accessibility: close any open project menu on outside click or Escape
  const menuContainerRef = React.useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
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

  // Keyboard navigation inside menu
  const [menuFocusIndex, setMenuFocusIndex] = React.useState(0);
  const menuItemRefs = [React.useRef<HTMLButtonElement | null>(null), React.useRef<HTMLButtonElement | null>(null)];
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
    setIsEditingProject(false);
    setNewProjectName('');
    setNewProjectDetails('');
    setShowCreateProject(true);
  };

  const openEdit = (projectId: string) => {
    beginEditProject(projectId);
    const project = projects.find(p => p.id === projectId);
    setIsEditingProject(true);
    setNewProjectName(project?.name || '');
    setNewProjectDetails(project?.description || '');
    setShowCreateProject(true);
  };

  const submitProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newProjectName.trim();
    const description = newProjectDetails.trim();
    if (!name || !description) return;
    if (isEditingProject && editProjectId) {
      updateProject(editProjectId, name, description);
      setShowCreateProject(false);
      endEditProject();
      navigate(`/projects/${editProjectId}`);
      return;
    }
    createProject(name, description);
    setShowCreateProject(false);
  };

  const handleDelete = (projectId: string) => {
    deleteProject(projectId);
    if (selectedProjectId === projectId) navigate('/projects');
  };

  const handleStartNewConversation = async (projectId: string) => {
    const title = (newChatName || '').trim();
    const details = (newChatDetails || '').trim();
    if (!title || !details) return;
    setIsSubmittingChat(true);
    try {
      const cid = await createChat(projectId, title, details);
      navigate(`/projects/${projectId}/chat/${cid}`);
    } catch {
      // On failure, user already saw toast; go back to project page
      // navigate(`/projects/${projectId}`);
    } finally {
      setShowCreateChat(false);
      setNewChatName('');
      setNewChatDetails('');
      setIsSubmittingChat(false);
    }
  };

  const openEditChat = (chatId: string, title: string) => {
    setChatEditId(chatId);
    setChatEditTitle(title);
    // Get details from context
    const chat = conversations.find(c => c.id === chatId);
    setChatEditDetails(chat?.details || '');
  };

  const submitEditChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProjectId || !chatEditId) return;
    const title = chatEditTitle.trim();
    const details = chatEditDetails.trim();
    if (!title || !details) return;
    updateChat(selectedProjectId, chatEditId, title, details);
    setChatEditId(null);
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
                <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/projects')}>Polaris</h1>
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
              <div className="flex items-center justify-between mb-3">
                <Link to="/projects" className="text-sm uppercase tracking-wide text-gray-400">Projects</Link>
                <button
                  onClick={openCreate}
                  className="p-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
                  title="New Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div style={{ height: 'calc(100vh - 280px)', overflowY: 'auto', scrollbarWidth: 'none' }}>
                <ul className="space-y-3">
                {sidebarProjects.map((p) => (
                  <li key={p.id}>
                    <div className="flex items-center gap-2 min-w-0">
                      <NavLink
                        to={`/projects/${p.id}`}
                        className={({ isActive }) =>
                          `flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm min-w-0 ${
                            isActive ? 'bg-dark-200 text-white' : 'text-gray-300 hover:bg-dark-200 hover:text-white'
                          }`
                        }
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 6a2 2 0 012-2h3.5a1 1 0 01.8.4l.9 1.2H16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="truncate min-w-0" title={p.name}>{p.name}</span>
                      </NavLink>
                      <div className="relative flex-shrink-0" ref={menuContainerRef}>
                        <button
                          ref={menuTriggerRef}
                          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-200"
                          aria-haspopup="menu"
                          aria-expanded={menuOpenForProject === p.id}
                          aria-controls={menuOpenForProject === p.id ? `project-menu-${p.id}` : undefined}
                          id={`project-menu-trigger-${p.id}`}
                          title="Project options"
                          onClick={(e) => { 
                            const direction = calculateMenuDirection(e.currentTarget);
                            setMenuDirection(direction);
                            setMenuOpenForProject(prev => (prev === p.id ? null : p.id)); 
                            setMenuFocusIndex(0); 
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 3a2 2 0 110 4 2 2 0 010-4zm0 5a2 2 0 110 4 2 2 0 010-4zm0 5a2 2 0 110 4 2 2 0 010-4z" />
                          </svg>
                        </button>
                        {menuOpenForProject === p.id && (
                          <div
                            id={`project-menu-${p.id}`}
                            role="menu"
                            aria-labelledby={`project-menu-trigger-${p.id}`}
                            className={`absolute right-0 w-40 bg-white text-gray-800 rounded-md overflow-hidden shadow-lg ring-1 ring-black/5 z-20 transform transition ease-out duration-150 ${
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
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:bg-gray-50"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); openEdit(p.id); setMenuOpenForProject(null); }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              ref={menuItemRefs[1]}
                              role="menuitem"
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 hover:text-red-700 focus:outline-none focus-visible:bg-gray-50"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); setDeleteProjectId(p.id); setMenuOpenForProject(null); }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedProjectId === p.id && (
                      <>
                        <div className="mt-2 pl-7 pr-3 flex items-center justify-end gap-2">
                          <button
                            className="p-1.5 rounded-md text-gray-300 hover:bg-dark-200 hover:text-white"
                            title="Search conversations"
                            onClick={() => {
                              setSearchProjectId(prev => (typeof prev === 'function' ? (prev as any)(p.id) : (prev === p.id ? null : p.id)));
                              setProjectSearch('');
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            className="p-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
                            title="Start new conversation"
                            onClick={() => { setShowCreateChat(true); }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>

                        {searchProjectId === p.id && (
                          <div className="mt-2 pl-7 pr-3">
                            <input
                              type="text"
                              className="w-full text-sm px-3 py-1.5 rounded-md bg-dark-200/40 text-gray-200 placeholder-gray-400 border border-dark-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              placeholder="Search conversations..."
                              value={projectSearch}
                              onChange={(e) => setProjectSearch(e.target.value)}
                            />
                          </div>
                        )}

                        <ul className="mt-2 space-y-1 pl-7">
                          {conversations
                            .filter(c => c.title.toLowerCase().includes(projectSearch.toLowerCase()))
                            .map((c) => (
                              <li key={c.id}>
                                <div className="flex items-center gap-2">
                                  <NavLink
                                    to={`/projects/${selectedProjectId}/chat/${c.id}`}
                                    className={({ isActive }) =>
                                      `flex-1 block px-3 py-2 rounded-md text-sm truncate ${
                                        isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-dark-200 hover:text-white'
                                      }`
                                    }
                                    title={c.title}
                                  >
                                    {c.title}
                                  </NavLink>
                                  <div className="relative">
                                    <button
                                      className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-dark-200"
                                      title="Chat options"
                                      onClick={() => setChatMenuOpenId(prev => prev === c.id ? null : c.id)}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 3a2 2 0 110 4 2 2 0 010-4zm0 5a2 2 0 110 4 2 2 0 010-4zm0 5a2 2 0 110 4 2 2 0 010-4z" />
                                      </svg>
                                    </button>
                                    {chatMenuOpenId === c.id && (
                                      <div className="absolute right-0 mt-1 w-40 bg-white text-gray-800 rounded-md overflow-hidden shadow-lg ring-1 ring-black/5 z-20">
                                        <button
                                          type="button"
                                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                          onClick={() => { openEditChat(c.id, c.title); setChatMenuOpenId(null); }}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 hover:text-red-700"
                                          onClick={() => { setChatDeleteId(c.id); setChatMenuOpenId(null); }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </>
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
                          Loading...
                        </div>
                      ) : (
                        'Load More Projects'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-gray-700 mt-auto">
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
            </div>

            {showCreateProject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateProject(false)} />
                <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{isEditingProject ? 'Edit Project' : 'Create Project'}</h3>
                    <button
                      onClick={() => setShowCreateProject(false)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={submitProject} className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="e.g. Marketing Website Redesign"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      autoFocus
                    />
                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Description</label>
                    <textarea
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Brief description, scope, goals..."
                      rows={4}
                      value={newProjectDetails}
                      onChange={(e) => setNewProjectDetails(e.target.value)}
                      required
                    />
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateProject(false)}
                        className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm rounded-md bg-primary-600 hover:bg-primary-700 text-white"
                        disabled={!newProjectName.trim() || !newProjectDetails.trim()}
                      >
                        {isEditingProject ? 'Save' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Chat Modal */}
            {chatEditId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setChatEditId(null)} />
                <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Edit Chat</h3>
                    <button
                      onClick={() => setChatEditId(null)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={submitEditChat} className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chat name</label>
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={chatEditTitle}
                      onChange={(e) => setChatEditTitle(e.target.value)}
                      autoFocus
                    />
                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Details</label>
                    <textarea
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      rows={4}
                      value={chatEditDetails}
                      onChange={(e) => setChatEditDetails(e.target.value)}
                      required
                    />
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setChatEditId(null)}
                        className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm rounded-md bg-primary-600 hover:bg-primary-700 text-white"
                        disabled={!chatEditTitle.trim() || !chatEditDetails.trim()}
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete Chat confirmation */}
            {chatDeleteId && selectedProjectId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setChatDeleteId(null)} />
                <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-sm mx-4">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Delete Chat</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-700">Are you sure you want to delete this chat? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setChatDeleteId(null)}
                        className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => { deleteChat(selectedProjectId, chatDeleteId); setChatDeleteId(null); }}
                        className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showCreateChat && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateChat(false)} />
                <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Create Chat</h3>
                    <button
                      onClick={() => setShowCreateChat(false)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); if (!selectedProjectId) return; handleStartNewConversation(selectedProjectId); }} className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chat name</label>
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="e.g. Brainstorm Q4 ideas"
                      value={newChatName || ''}
                      onChange={(e) => setNewChatName(e.target.value)}
                      autoFocus
                    />
                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Details</label>
                    <textarea
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Brief context for this chat..."
                      rows={4}
                      value={newChatDetails}
                      onChange={(e) => setNewChatDetails(e.target.value)}
                      required
                    />
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateChat(false)}
                        className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm rounded-md bg-primary-600 hover:bg-primary-700 text-white"
                        disabled={isSubmittingChat || !((newChatName || '').trim()) || !((newChatDetails || '').trim())}
                      >
                        {isSubmittingChat ? 'Creating…' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete confirmation */}
            {deleteProjectId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteProjectId(null)} />
                <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-sm mx-4">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-700">Are you sure you want to delete this project? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setDeleteProjectId(null)}
                        className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (deleteProjectId) handleDelete(deleteProjectId); setDeleteProjectId(null); }}
                        className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
    </>
  );
};

export default Sidebar;


