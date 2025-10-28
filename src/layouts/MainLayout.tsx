import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { ProjectsProvider, useProjects } from '../context/ProjectsContext';
import { ChatProvider, useChats } from '../context/ChatContext';
import InviteModal from '../components/ui/InviteModal';
import { createTeam, createTeamInvitation } from '../services/teamService';
import { showErrorToast, showSuccessToast } from '../utils/toast';


// Component to load chats for first project
const ChatLoader: React.FC = () => {
  const { projects } = useProjects();
  const { ensureInitialChatsLoaded } = useChats();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we're on a project page
    const match = location.pathname.match(/^\/projects\/([^\/]+)/);
    const selectedProjectId = match ? match[1] : null;
    
    if (selectedProjectId) {
      // Fetch initial chats for both sidebar and conversations tab
      ensureInitialChatsLoaded(selectedProjectId);
    } else if (location.pathname === '/') {
      // Handle root path navigation
      if (projects && projects.length > 0) {
        // If projects exist, redirect to first project
        const firstProjectId = projects[0].id;
        navigate(`/projects/${firstProjectId}`, { replace: true });
      } else {
        // If no projects exist, redirect to projects list
        navigate('/projects', { replace: true });
      }
    }
    // If we're on /projects, don't redirect - let the user stay on the projects list page
  }, [projects, location.pathname]);

  return null;
};

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

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
  const [isInviting, setIsInviting] = useState(false);
  const [inviteTimestamp, setInviteTimestamp] = useState(0);

  // Project create/edit/delete and chat flows are now in Sidebar via context

  const handleInviteSubmit = async (email: string) => {
    try {
      setIsInviting(true);
      let teamId = localStorage.getItem('teamId');

      // If no teamId cached, create a new team
      if (!teamId) {
        const firstName = user?.firstName;
        if (!firstName) {
          showErrorToast('Your profile is missing first name. Please update your profile.');
          return;
        }
        
        const team = await createTeam({ 
          name: `${firstName} Team`, 
          description: 'Default team description' 
        });
        teamId = String(team.id);
        localStorage.setItem('teamId', teamId);
      }

      await createTeamInvitation(Number(teamId), { invited_email: email });
      showSuccessToast('Invitation sent successfully');
      setShowInviteModal(false);
      
      // Trigger refresh in MembersList
      setInviteTimestamp(Date.now());
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to send invitation';
      showErrorToast(message);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <ProjectsProvider>
      <ChatProvider>
        <ChatLoader />
        <div className="h-screen bg-light-200 flex">
        <Sidebar
          open={sidebarOpen}
          isDesktop={isDesktop}
          onToggle={toggleSidebar}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col h-full">
          <Header
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
            user={user}
            onLogout={handleLogout}
          />
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-light-200 p-4">
            <Outlet context={{ 
              openInviteModal: () => setShowInviteModal(true),
              inviteTimestamp
            }} />
          </main>
        </div>

        {/* Invite Modal */}
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInviteSubmit}
          isSubmitting={isInviting}
        />
        </div>
      </ChatProvider>
    </ProjectsProvider>
  );
};

export default MainLayout;
