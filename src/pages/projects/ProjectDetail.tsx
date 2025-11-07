import { Link, useNavigate, useParams } from 'react-router-dom';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjects } from '../../context/ProjectsContext';
import { useChats } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { fetchProjectById } from '../../services/projectService';
import { listProjectMembers, ProjectMemberDTO } from '../../services/projectMemberService';
import Loader from '../../components/common/Loader';
import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { formatDate, formatTime } from '../../utils/dateTime';
import InviteProjectMemberModal from '../../components/ui/InviteProjectMemberModal';
import EditProjectMemberModal from '../../components/ui/EditProjectMemberModal';
import DeleteProjectMemberModal from '../../components/ui/DeleteProjectMemberModal';
import { showErrorToast } from '../../utils/toast';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
}


const ProjectDetail: React.FC = () => {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'conversations' | 'members' | 'settings'>('conversations');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [didMount, setDidMount] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  // Members state
  const [members, setMembers] = useState<ProjectMemberDTO[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersPagination, setMembersPagination] = useState<{
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  } | null>(null);
  const [currentMemberPage, setCurrentMemberPage] = useState(1);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  
  // Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editMemberUserId, setEditMemberUserId] = useState<number | null>(null);
  const [deleteMemberUserId, setDeleteMemberUserId] = useState<number | null>(null);
  
  const { projects } = useProjects();
  const { 
    chatsByProject, 
    ensureProjectChatsLoaded,
    ensureInitialChatsLoaded, 
    conversationsSearchQuery, 
    setConversationsSearchQuery, 
    currentPage, 
    setCurrentPage, 
    pagination,
    createChat
  } = useChats();

  const { role: projectRole, isLoading: projectRoleLoading } = useProjectRole(projectId);
  
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
      lastMessage: c.details || t('chat.interface.noDetailsAvailable'),
      updatedAt: c.updated_at || c.created_at || new Date().toISOString(),
      messageCount: c.message_count || 0,
    }));
  }, [chatsByProject, projectId, t]);
  
  // Load project members
  const loadMembers = useCallback(async () => {
    if (!projectId) return;
    
    setMembersLoading(true);
    try {
      const response = await listProjectMembers(projectId, currentMemberPage, 10);
      setMembers(response.members);
      setMembersPagination(response.pagination);
      
      // Determine if current user is project owner
      const ownerMember = response.members.find(m => m.role === 'owner');
      if (ownerMember && user) {
        setIsProjectOwner(ownerMember.user_id === Number(user.id));
      }
    } catch (err: any) {
      showErrorToast(err?.response?.data?.error || t('errors.loadMembersFailed'));
    } finally {
      setMembersLoading(false);
    }
  }, [projectId, currentMemberPage, user]);

  useEffect(() => {
    if (activeTab === 'members' && projectId) {
      loadMembers();
    }
  }, [activeTab, projectId, loadMembers]);

  const handleMemberAction = () => {
    loadMembers();
  };
  
  const handleDeleteProject = () => {
    if (window.confirm(t('projects.detail.settings.confirmDelete'))) {
      // In a real app, you would make an API call here
      navigate('/projects');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Project header */}
      <div className="bg-white rounded-lg shadow-card p-6 flex-shrink-0">
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className='w-3/4'>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p title={project.description} className="mt-1 text-gray-600 line-clamp-2">{project.description}</p>
            <p className="mt-2 text-sm text-gray-500">
              {t('projects.detail.createdOn', { date: formatDate(project.createdAt) })} • {t('projects.detail.lastUpdated', { date: formatDate(project.updatedAt) })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* New Conversation button - hidden while loading, only show for owner/editor */}
            {!projectRoleLoading && (projectRole === 'owner' || projectRole === 'editor') && (
              <Button
                variant="primary"
                isLoading={isCreatingChat}
                onClick={async () => {
                  if (!projectId) return;
                  setIsCreatingChat(true);
                  try {
                    const chatId = await createChat(projectId, 'New Chat', '');
                    navigate(`/projects/${projectId}/chat/${chatId}`);
                  } catch {
                    // Error handled in context
                  } finally {
                    setIsCreatingChat(false);
                  }
                }}
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                }
              >
                {isCreatingChat ? t('common.creating') : t('projects.detail.newConversation')}
              </Button>
            )}
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
              {t('projects.detail.tabs.conversations')}
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'members'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('projects.detail.tabs.members')}
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
                  placeholder={t('projects.detail.conversations.search')}
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
                              {t('projects.detail.conversations.messages', { count: conversation.messageCount })}
                            </span>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            {t('projects.detail.conversations.lastUpdated', { date: formatDate(conversation.updatedAt), time: formatTime(conversation.updatedAt) })}
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('projects.detail.conversations.noConversations')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('projects.detail.conversations.noConversationsMessage')}</p>
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
                      {t('pagination.previous')}
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.has_next}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('pagination.next')}
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        {t('pagination.showing')}{' '}
                        <span className="font-medium">
                          {((pagination.current_page - 1) * (pagination.per_page || 10)) + 1}
                        </span>{' '}
                        {t('pagination.to')}{' '}
                        <span className="font-medium">
                          {Math.min(pagination.current_page * (pagination.per_page || 10), pagination.total || 0)}
                        </span>{' '}
                        {t('pagination.of')}{' '}
                        <span className="font-medium">{pagination.total || 0}</span>{' '}
                        {t('pagination.results')}
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label={t('pagination.previous')}>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!pagination.has_prev}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">{t('pagination.previous')}</span>
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
                          <span className="sr-only">{t('pagination.next')}</span>
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
                <h2 className="text-lg font-medium text-gray-900">{t('projects.detail.members.title')}</h2>
                {isProjectOwner && (
                  <Button
                    variant="outline"
                    onClick={() => setInviteModalOpen(true)}
                    leftIcon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                    }
                  >
                    {t('projects.detail.members.inviteMember')}
                  </Button>
                )}
              </div>
              
              {membersLoading ? (
                <div className="py-8">
                  <Loader />
                </div>
              ) : members.length === 0 ? (
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('projects.detail.members.noMembers')}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isProjectOwner ? t('projects.detail.members.noMembersMessage') : t('projects.detail.members.noMembersMessageViewer')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('projects.detail.members.tableHeaders.name')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('projects.detail.members.tableHeaders.role')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('projects.detail.members.tableHeaders.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => {
                          const isOwner = member.role === 'owner';
                          const canEdit = isProjectOwner && !isOwner;
                          const displayName = `${member.user.first_name} ${member.user.last_name}`.trim();
                          const displayEmail = member.user.email;
                          const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : member.user.email[0].toUpperCase();
                          
                          return (
                            <tr key={member.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                                      {initials}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{displayName}</div>
                                    <div className="text-sm text-gray-500">{displayEmail}</div>
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
                                  {t(`projects.detail.members.roles.${member.role}`)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => setEditMemberUserId(member.user_id)}
                                      className="text-primary-600 hover:text-primary-900 mr-4"
                                    >
                                      {t('common.edit')}
                                    </button>
                                    <button
                                      onClick={() => setDeleteMemberUserId(member.user_id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      {t('common.remove')}
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Members pagination */}
                  {membersPagination && membersPagination.pages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentMemberPage(currentMemberPage - 1)}
                          disabled={!membersPagination.has_prev}
                          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('pagination.previous')}
                        </button>
                        <button
                          onClick={() => setCurrentMemberPage(currentMemberPage + 1)}
                          disabled={!membersPagination.has_next}
                          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('pagination.next')}
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            {t('pagination.showing')}{' '}
                            <span className="font-medium">
                              {((membersPagination.current_page - 1) * membersPagination.per_page) + 1}
                            </span>{' '}
                            {t('pagination.to')}{' '}
                            <span className="font-medium">
                              {Math.min(membersPagination.current_page * membersPagination.per_page, membersPagination.total)}
                            </span>{' '}
                            {t('pagination.of')}{' '}
                            <span className="font-medium">{membersPagination.total}</span> {t('pagination.results')}
                          </p>
                        </div>
                        <div>
                          <button
                            onClick={() => setCurrentMemberPage(currentMemberPage - 1)}
                            disabled={!membersPagination.has_prev}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t('pagination.previous')}
                          </button>
                          <button
                            onClick={() => setCurrentMemberPage(currentMemberPage + 1)}
                            disabled={!membersPagination.has_next}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t('pagination.next')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Settings tab - Only for project owners (hidden while loading) */}
          {activeTab === 'settings' && !projectRoleLoading && projectRole === 'owner' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">{t('projects.detail.settings.title')}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">
                      {t('projects.detail.settings.projectNameLabel')}
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
                      {t('projects.detail.settings.descriptionLabel')}
                    </label>
                    <textarea
                      id="project-description"
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      defaultValue={project.description}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="primary">{t('common.saveChanges')}</Button>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('projects.detail.settings.dangerZone')}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {t('projects.detail.settings.dangerZoneMessage')}
                </p>
                <Button
                  variant="danger"
                  onClick={handleDeleteProject}
                >
                  {t('projects.detail.settings.deleteProject')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {projectId && (
        <>
          <InviteProjectMemberModal
            isOpen={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            projectId={projectId}
            existingMemberUserIds={members.map(m => m.user_id)}
            onSuccess={handleMemberAction}
          />
          
          {editMemberUserId !== null && (() => {
            const member = members.find(m => m.user_id === editMemberUserId);
            if (!member) return null;
            const memberName = `${member.user.first_name} ${member.user.last_name}`.trim();
            return (
              <EditProjectMemberModal
                isOpen={true}
                onClose={() => setEditMemberUserId(null)}
                projectId={projectId}
                memberUserId={editMemberUserId}
                currentRole={member.role}
                memberName={memberName}
                onSuccess={handleMemberAction}
              />
            );
          })()}
          
          {deleteMemberUserId !== null && (() => {
            const member = members.find(m => m.user_id === deleteMemberUserId);
            if (!member) return null;
            const memberName = `${member.user.first_name} ${member.user.last_name}`.trim();
            return (
              <DeleteProjectMemberModal
                isOpen={true}
                onClose={() => setDeleteMemberUserId(null)}
                projectId={projectId}
                memberUserId={deleteMemberUserId}
                memberName={memberName}
                onSuccess={handleMemberAction}
              />
            );
          })()}
        </>
      )}
    </div>
  );
};

export default ProjectDetail;
