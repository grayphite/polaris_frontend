import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { ProjectsProvider, useProjects } from '../context/ProjectsContext';
import { ChatProvider, useChats } from '../context/ChatContext';
import InviteModal from '../components/ui/InviteModal';
import MemberInviteConsentModal from '../components/ui/MemberInviteConsentModal';
import { createTeam, createTeamInvitation } from '../services/teamService';
import { previewMemberAddition } from '../services/paymentService';
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

  // Consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentCostCents, setConsentCostCents] = useState(0);
  const [consentCurrency, setConsentCurrency] = useState('brl');
  const [isCheckingPreview, setIsCheckingPreview] = useState(false);

  // Project create/edit/delete and chat flows are now in Sidebar via context

  const handleOpenInviteModal = async () => {
    try {
      setIsCheckingPreview(true);
      let teamId = localStorage.getItem('teamId');

      // If no teamId cached, create a new team
      if (!teamId) {
        const firstName = user?.firstName;
        if (!firstName) {
          showErrorToast('Your profile is missing first name. Please update your profile.');
          setIsCheckingPreview(false);
          return;
        }
        
        const team = await createTeam({ 
          name: `${firstName} Team`, 
          description: 'Default team description' 
        });
        teamId = String(team.id);
        localStorage.setItem('teamId', teamId);
      }

      // Check preview API to see if additional charge will apply
      try {
        const preview = await previewMemberAddition(teamId);
        
        if (!preview.allowed) {
          // Show consent modal with cost information
          setConsentCostCents(preview.additional_member_cost_cents);
          setConsentCurrency(preview.currency);
          setShowConsentModal(true);
        } else {
          // No additional charge, open invite modal directly
          setShowInviteModal(true);
        }
      } catch (previewError: any) {
        // If preview API fails, show error but don't block invite modal
        const previewMsg = previewError?.response?.data?.message || previewError?.response?.data?.error || 'Failed to check member cost';
        showErrorToast(previewMsg);
        // Still allow opening invite modal on preview failure
        setShowInviteModal(true);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to open invite modal';
      showErrorToast(message);
    } finally {
      setIsCheckingPreview(false);
    }
  };

  const handleConsentConfirm = () => {
    setShowConsentModal(false);
    setShowInviteModal(true);
  };

  const handleConsentCancel = () => {
    setShowConsentModal(false);
  };

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
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      const errorMessage = errorData?.error || errorData?.message;

      // Handle specific error cases for conflicts and user already exists
      if (status === 409 || status === 400) {
        // Check for specific error messages that indicate user/invitation already exists
        if (
          errorMessage?.includes('already registered') ||
          errorMessage?.includes('already a member') ||
          errorMessage?.includes('pending invitation already exists')
        ) {
          showErrorToast('This email is already registered or has been invited. Please use a different email address.');
        } else if (errorMessage?.includes('Invalid email format')) {
          showErrorToast('Please enter a valid email address.');
        } else if (errorMessage?.includes('required')) {
          showErrorToast('Please enter an email address.');
        } else {
          // For other 400/409 errors, show the API message
          showErrorToast(errorMessage || 'Failed to send invitation. Please try again.');
        }
      } else {
        // For other errors, show the API message or generic error
        showErrorToast(errorMessage || 'Failed to send invitation. Please try again.');
      }
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
              openInviteModal: handleOpenInviteModal,
              inviteTimestamp
            }} />
          </main>
        </div>

        {/* Consent Modal */}
        <MemberInviteConsentModal
          isOpen={showConsentModal}
          onClose={handleConsentCancel}
          onConfirm={handleConsentConfirm}
          costCents={consentCostCents}
          currency={consentCurrency}
          isLoading={isCheckingPreview}
        />

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
