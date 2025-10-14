import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { ProjectsProvider } from '../context/ProjectsContext';
import InviteModal from '../components/ui/InviteModal';

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

  // Projects state moved to ProjectsProvider

  const selectedProjectId = (() => {
    const match = location.pathname.match(/^\/projects\/([^\/]+)/);
    return match ? match[1] : null;
  })();

  // Conversations moved to ProjectsProvider

  // Project modal state handled by Sidebar via context

  // Seeding moved inside ProjectsProvider

  // Chat creation managed in Sidebar via context

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Project create/edit/delete and chat flows are now in Sidebar via context

  const handleInviteSubmit = (email: string, role: string) => {
    // In a real app, you would make an API call to send the invitation
    console.log('Inviting:', email, 'with role:', role);
    setShowInviteModal(false);
  };

  return (
    <ProjectsProvider>
      <div className="min-h-screen bg-light-200 flex">
        <Sidebar
          open={sidebarOpen}
          isDesktop={isDesktop}
          onToggle={toggleSidebar}
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
                {location.pathname === '/' ? 'Projects' : location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1)}
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
                  
                  {/* All menu items accessible to all users */}
                  <NavLink
                    to="/members"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Manage Team
                  </NavLink>
                  {/* <NavLink
                    to="/company-profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Company Profile
                  </NavLink> */}
                  {/* <NavLink
                    to="/subscription"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Subscription
                  </NavLink> */}
                  
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
            <Outlet context={{ 
              openInviteModal: () => setShowInviteModal(true)
            }} />
          </main>
        </div>

        {/* Invite Modal */}
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInviteSubmit}
        />
      </div>
    </ProjectsProvider>
  );
};

export default MainLayout;
