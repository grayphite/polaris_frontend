import { AnimatePresence, motion } from 'framer-motion';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isChatRoute = location.pathname.includes('/chat');

  // Projects state (mocked list for now)
  const [projects, setProjects] = useState(
    [
      { id: '1', name: 'Marketing Campaign' },
      { id: '2', name: 'Product Roadmap' },
      { id: '3', name: 'Customer Research' },
    ]
  );

  const selectedProjectId = (() => {
    const match = location.pathname.match(/^\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  })();

  // Conversations per project (mocked state)
  const [conversationsByProject, setConversationsByProject] = useState<Record<string, { id: string; title: string }[]>>({
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

  const conversations = selectedProjectId ? (conversationsByProject[selectedProjectId] || []) : [];

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchProjectId, setSearchProjectId] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');

  const handleCreateProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    const id = Date.now().toString();
    const project = { id, name };
    setProjects(prev => [{ id, name }, ...prev]);
    setConversationsByProject(prev => ({ ...prev, [id]: [] }));
    setShowCreateProject(false);
    setNewProjectName('');
    navigate(`/projects/${project.id}`);
  };

  const handleStartNewConversation = (projectId: string) => {
    const newId = Date.now().toString();
    setConversationsByProject(prev => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: [{ id: newId, title: '' }, ...list] };
    });
    navigate(`/projects/${projectId}/chat/${newId}`);
  };

  return (
    <div className="min-h-screen bg-light-200 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || !isChatRoute) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2 }}
            className={`bg-dark-300 text-white w-64 flex-shrink-0 fixed md:relative h-full z-20 flex flex-col`}
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Polaris</h1>
                <button 
                  onClick={toggleSidebar}
                  className="md:hidden text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <nav className="p-4 pb-28 flex-1 overflow-y-auto">
              {/* Projects header with create button */}
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
                    {/* Project row */}
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

                    {/* Nested conversations when this project is active */}
                    {selectedProjectId === p.id && (
                      <>
                        {/* Actions row: search + new conversation */}
                        <div className="mt-2 pl-7 flex items-center gap-2">
                          <button
                            className="p-1.5 rounded-md text-gray-300 hover:bg-dark-200 hover:text-white"
                            title="Search conversations"
                            onClick={() => {
                              setSearchProjectId(prev => (prev === p.id ? null : p.id));
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
                            onClick={() => handleStartNewConversation(p.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>

                        {/* Inline search input */}
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

            {/* Create Project Modal */}
            {showCreateProject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateProject(false)} />
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
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
                  <form onSubmit={handleCreateProject} className="p-6">
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
                <button
                  onClick={handleLogout}
                  className="ml-auto text-gray-400 hover:text-white flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 5a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L12 12.586V8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0 gap-3">
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="ml-1 sm:ml-2 text-base sm:text-lg font-medium truncate">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1)}
              </h2>
            </div>
            
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center text-sm focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Your Profile
                  </NavLink>
                  <NavLink
                    to="/members"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Manage Team
                  </NavLink>
                  <NavLink
                    to="/company-profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Company Profile
                  </NavLink>
                  <NavLink
                    to="/subscription"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Subscription
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto bg-light-200 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
