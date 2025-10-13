import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  isDesktop: boolean;
  onToggle: () => void;
  onLogout: () => void;
  user?: { username?: string; email?: string } | null;

  projects: { id: string; name: string }[];
  selectedProjectId: string | null;
  conversations: { id: string; title: string }[];

  showCreateProject: boolean;
  setShowCreateProject: (v: boolean) => void;
  newProjectName: string;
  setNewProjectName: (v: string) => void;
  onCreateProject: (e?: React.FormEvent) => void;

  searchProjectId: string | null;
  setSearchProjectId: (v: string | null | ((prev: string | null) => string | null)) => void;
  projectSearch: string;
  setProjectSearch: (v: string) => void;
  onStartNewConversation: (projectId: string) => void;

  // Create Chat modal props
  showCreateChat?: boolean;
  setShowCreateChat?: (v: boolean) => void;
  newChatName?: string;
  setNewChatName?: (v: string) => void;
  onCreateChat?: (e?: React.FormEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  isDesktop,
  onToggle,
  onLogout,
  user,
  projects,
  selectedProjectId,
  conversations,
  showCreateProject,
  setShowCreateProject,
  newProjectName,
  setNewProjectName,
  onCreateProject,
  searchProjectId,
  setSearchProjectId,
  projectSearch,
  setProjectSearch,
  onStartNewConversation,
  showCreateChat,
  setShowCreateChat,
  newChatName,
  setNewChatName,
  onCreateChat,
}) => {
  const navigate = useNavigate();
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2 }}
            className={`bg-dark-300 text-white w-64 flex-shrink-0 fixed md:relative inset-y-0 left-0 h-screen md:h-auto z-30 flex flex-col`}
            role={!isDesktop ? 'dialog' : undefined}
            aria-modal={!isDesktop ? true : undefined}
            aria-label="Sidebar navigation"
            id="app-sidebar"
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/projects/1')}>Polaris</h1>
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

            <nav className="p-4 pb-28 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <Link to="/projects" className="text-sm uppercase tracking-wide text-gray-400">Projects</Link>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="p-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
                  title="New Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <ul className="space-y-3 mb-6">
                {projects.map((p) => (
                  <li key={p.id}>
                    <NavLink
                      to={`/projects/${p.id}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                          isActive ? 'bg-dark-200 text-white' : 'text-gray-300 hover:bg-dark-200 hover:text-white'
                        }`
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h3.5a1 1 0 01.8.4l.9 1.2H16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <span className="truncate">{p.name}</span>
                    </NavLink>

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
                            onClick={() => onStartNewConversation(p.id)}
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
                                <NavLink
                                  to={`/projects/${selectedProjectId}/chat/${c.id}`}
                                  className={({ isActive }) =>
                                    `block px-3 py-2 rounded-md text-sm truncate ${
                                      isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-dark-200 hover:text-white'
                                    }`
                                  }
                                  title={c.title}
                                >
                                  {c.title}
                                </NavLink>
                              </li>
                            ))}
                        </ul>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {showCreateProject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateProject(false)} />
                <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Create Project</h3>
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
                  <form onSubmit={onCreateProject} className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="e.g. Marketing Website Redesign"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      autoFocus
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
                        disabled={!newProjectName.trim()}
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showCreateChat && setShowCreateChat && (
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
                  <form onSubmit={onCreateChat} className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chat name</label>
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="e.g. Brainstorm Q4 ideas"
                      value={newChatName || ''}
                      onChange={(e) => setNewChatName && setNewChatName(e.target.value)}
                      autoFocus
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
                        disabled={!((newChatName || '').trim())}
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
                {/* <button
                  onClick={onLogout}
                  className="ml-auto text-gray-400 hover:text-white flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 5a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L12 12.586V8z" clipRule="evenodd" />
                  </svg>
                </button> */}
              </div>
            </div>
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


