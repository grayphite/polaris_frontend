import { Link, useNavigate, useParams } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { useProjects } from '../../context/ProjectsContext';
import { useChats } from '../../context/ChatContext';
import { fetchProjectById } from '../../services/projectService';
import Loader from '../../components/common/Loader';

import Button from '../../components/ui/Button';
import CreateChatModal from '../../components/ui/CreateChatModal';
import { motion } from 'framer-motion';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
}

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatarUrl?: string;
}

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'conversations' | 'members' | 'settings'>('conversations');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [didMount, setDidMount] = useState(false);
  const [showCreateChatModal, setShowCreateChatModal] = useState(false);
  
  const { projects } = useProjects();
  const { 
    chatsByProject, 
    ensureProjectChatsLoaded,
    ensureInitialChatsLoaded, 
    conversationsSearchQuery, 
    setConversationsSearchQuery, 
    currentPage, 
    setCurrentPage, 
    pagination 
  } = useChats();

  const project = useMemo(() => {
    const ctxProject = (projects || []).find(p => p.id === projectId);
    return {
      id: projectId,
      name: ctxProject?.name || 'Project',
      description: ctxProject?.description || '',
      createdAt: ctxProject?.created_at || new Date().toISOString(),
      updatedAt: ctxProject?.updated_at || new Date().toISOString(),
    };
  }, [projectId, projects]);

  // Load chats when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      setIsLoadingConversations(true);
      ensureInitialChatsLoaded(projectId)
        .finally(() => setIsLoadingConversations(false));
    }
  }, [projectId]); // Removed ensureInitialChatsLoaded from dependencies

  // Initialize local input from context once to avoid initial no-op debounce
  useEffect(() => {
    if (!didMount) {
      setLocalSearchQuery(conversationsSearchQuery || '');
      setDidMount(true);
    }
  }, [didMount, conversationsSearchQuery]);

  // Debounced search effect with guard to avoid redundant updates
  useEffect(() => {
    if (!didMount) return; // skip first render
    const timer = setTimeout(() => {
      if (localSearchQuery !== conversationsSearchQuery) {
        setConversationsSearchQuery(localSearchQuery);
        setCurrentPage(1); // Reset to first page when searching
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchQuery, conversationsSearchQuery, setConversationsSearchQuery, didMount]);

  // Load chats when search query or page changes
  useEffect(() => {
    if (projectId) {
      setIsLoadingConversations(true);
      ensureProjectChatsLoaded(projectId)
        .finally(() => setIsLoadingConversations(false));
    }
  }, [conversationsSearchQuery, currentPage, projectId]);

  
  // Use conversations from context (selected project) or empty for new projects
  const conversations: Conversation[] = useMemo(() => {
    const list = projectId ? (chatsByProject[projectId] || []) : [];
    if (list.length === 0) return [];
    return list.map((c) => ({
      id: c.id,
      title: c.title,
      lastMessage: c.details || 'No details available.',
      updatedAt: c.updated_at || c.created_at || new Date().toISOString(),
      messageCount: c.message_count || 0,
    }));
  }, [chatsByProject, projectId]);
  
  // Mock data for members
  const members: ProjectMember[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'owner',
    },
    {
      id: '2',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      role: 'editor',
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'michael@example.com',
      role: 'editor',
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily@example.com',
      role: 'viewer',
    },
  ];
  
  const handleDeleteProject = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      // In a real app, you would make an API call here
      navigate('/projects');
    }
  };

  const handleChatCreated = (chatId: string) => {
    navigate(`/projects/${projectId}/chat/${chatId}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Project header */}
      <div className="bg-white rounded-lg shadow-card p-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-gray-600">{project.description}</p>
            <p className="mt-2 text-sm text-gray-500">
              Created on {formatDate(project.createdAt)} • Last updated {formatDate(project.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setShowCreateChatModal(true)}
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              }
            >
              New Conversation
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-card flex-1 flex flex-col">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'conversations'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Conversations
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'members'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members
            </button>
            {/* <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button> */}
          </nav>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          {/* Conversations tab */}
          {activeTab === 'conversations' && (
            <div className="space-y-6 h-full flex flex-col">
              {/* Search bar */}
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm shadow-sm"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Conversations list + Pagination in one scroll region */}
              <div className="flex-1 min-h-0 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="py-8"><Loader /></div>
              ) : conversations.length > 0 ? (
                <div className="space-y-4 pb-6">
                  {conversations.map((conversation, index) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Link to={`/projects/${projectId}/chat/${conversation.id}`}>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-light-100 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{conversation.title}</h3>
                              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{conversation.lastMessage}</p>
                            </div>
                            <span className="bg-light-300 text-xs px-2 py-1 rounded-full">
                              {conversation.messageCount} messages
                            </span>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            Last updated on {formatDate(conversation.updatedAt)} at {formatTime(conversation.updatedAt)}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Start a new conversation from the sidebar.</p>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.has_prev}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.has_next}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {((pagination.current_page - 1) * (pagination.per_page || 10)) + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.current_page * (pagination.per_page || 10), pagination.total || 0)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total || 0}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!pagination.has_prev}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Show page numbers with ellipsis for large page counts */}
                        {(() => {
                          const currentPage = pagination.current_page;
                          const totalPages = pagination.pages;
                          const pages = [];
                          
                          if (totalPages <= 7) {
                            // Show all pages if 7 or fewer
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // Show first page
                            pages.push(1);
                            
                            if (currentPage > 4) {
                              pages.push('...');
                            }
                            
                            // Show pages around current page
                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPages - 1, currentPage + 1);
                            
                            for (let i = start; i <= end; i++) {
                              if (i !== 1 && i !== totalPages) {
                                pages.push(i);
                              }
                            }
                            
                            if (currentPage < totalPages - 3) {
                              pages.push('...');
                            }
                            
                            // Show last page
                            if (totalPages > 1) {
                              pages.push(totalPages);
                            }
                          }
                          
                          return pages.map((page, index) => (
                            page === '...' ? (
                              <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                                ...
                              </span>
                            ) : (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page as number)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  page === pagination.current_page
                                    ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          ));
                        })()}
                        
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!pagination.has_next}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          )}
          
          {/* Members tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Project Members</h2>
                <Button
                  variant="outline"
                  leftIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                  }
                >
                  Invite Member
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {member.avatarUrl ? (
                                <img className="h-10 w-10 rounded-full" src={member.avatarUrl} alt={member.name} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.role === 'owner'
                              ? 'bg-purple-100 text-purple-800'
                              : member.role === 'editor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-4">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Settings tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Project Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">
                      Project Name
                    </label>
                    <input
                      type="text"
                      id="project-name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      defaultValue={project.name}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="project-description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="project-description"
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      defaultValue={project.description}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="primary">Save Changes</Button>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Once you delete a project, there is no going back. Please be certain.
                </p>
                <Button
                  variant="danger"
                  onClick={handleDeleteProject}
                >
                  Delete Project
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Chat Modal */}
      {projectId && (
        <CreateChatModal
          isOpen={showCreateChatModal}
          onClose={() => setShowCreateChatModal(false)}
          projectId={projectId}
          onSuccess={handleChatCreated}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
