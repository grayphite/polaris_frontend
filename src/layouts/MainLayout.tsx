import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Responsive sidebar behavior
  useEffect(() => {
    const updateViewportState = () => {
      const desktop = window.innerWidth >= 768; // md breakpoint in Tailwind
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
    };

    updateViewportState();
    window.addEventListener('resize', updateViewportState);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDesktop) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updateViewportState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDesktop]);

  // Close sidebar on route change for mobile for a more native feel
  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [location.pathname, isDesktop]);

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

  // Create Chat modal state
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [activeProjectForChat, setActiveProjectForChat] = useState<string | null>(null);

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
    // Open the Create Chat modal for the given project (renamed behavior)
    setActiveProjectForChat(projectId);
    setNewChatName('');
    setShowCreateChat(true);
  };

  const handleCreateChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newChatName.trim();
    if (!name || !activeProjectForChat) return;
    const newId = Date.now().toString();
    setConversationsByProject(prev => {
      const list = prev[activeProjectForChat!] || [];
      return { ...prev, [activeProjectForChat!]: [{ id: newId, title: name }, ...list] };
    });
    setShowCreateChat(false);
    setNewChatName('');
    const pid = activeProjectForChat;
    setActiveProjectForChat(null);
    try {
      window.localStorage.setItem(`chatTitle:${newId}`, name);
    } catch {}
    navigate(`/projects/${pid}/chat/${newId}`, { state: { title: name } });
  };

  return (
    <div className="min-h-screen bg-light-200 flex">
      <Sidebar
        open={sidebarOpen}
        isDesktop={isDesktop}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
        user={user}
        projects={projects}
        selectedProjectId={selectedProjectId}
        conversations={conversations}
        showCreateProject={showCreateProject}
        setShowCreateProject={setShowCreateProject}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        onCreateProject={handleCreateProject}
        searchProjectId={searchProjectId}
        setSearchProjectId={setSearchProjectId}
        projectSearch={projectSearch}
        setProjectSearch={setProjectSearch}
        // Chat creation
        onStartNewConversation={handleStartNewConversation}
        showCreateChat={showCreateChat}
        setShowCreateChat={setShowCreateChat}
        newChatName={newChatName}
        setNewChatName={setNewChatName}
        onCreateChat={handleCreateChat}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0 gap-3">
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                aria-controls="app-sidebar"
                aria-expanded={sidebarOpen}
                aria-label="Toggle sidebar"
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
          <Outlet context={{ openCreateProject: () => setShowCreateProject(true) }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
