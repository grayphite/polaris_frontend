import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectsContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import Loader from '../../components/common/Loader';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  conversationsCount: number | null;
  members: number;
  tags: string[];
}

const ProjectsList: React.FC = () => {
  const { t } = useTranslation();
  const { 
    projects, 
    projectsLoading, 
    searchQuery, 
    setSearchQuery, 
    currentPage, 
    setCurrentPage, 
    pagination 
  } = useProjects();
  const { user } = useAuth();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [didMount, setDidMount] = useState(false);
  
  // Convert API projects to display format
  const displayProjects: Project[] = useMemo(() => {
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      conversationsCount: p.chat_count ?? null,
      members: 1,
      tags: [],
    } as Project));
  }, [projects]);
  
  // Initialize local input from context once to avoid initial no-op debounce
  useEffect(() => {
    if (!didMount) {
      setLocalSearchQuery(searchQuery || '');
      setDidMount(true);
    }
  }, [didMount, searchQuery]);

  // Debounced search effect with guard to avoid redundant updates
  useEffect(() => {
    if (!didMount) return; // skip first render
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        setSearchQuery(localSearchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery, setSearchQuery, didMount]);
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-6 flex-1">
      {/* Search and New Project in same row */}
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('projects.list.search')}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm shadow-sm"
            value={localSearchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* New Project Button - Only visible to global owners */}
        {user?.role === 'owner' && (
          <Button
            variant="primary"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
            onClick={() => { /* open handled in sidebar; route to sidebar action via hash */ const el = document.querySelector('#app-sidebar'); if (el) { const event = new CustomEvent('sidebar:create-project'); window.dispatchEvent(event as any); } }}
          >
            {t('projects.list.newProject')}
          </Button>
        )}
      </div>
      
      {/* Projects grid */}
      {projectsLoading ? (
        <div className="h-full flex items-center justify-center">
          <Loader size="lg" color="primary" />
          {/* <p className="mt-2 text-gray-500">Loading projects...</p> */}
        </div>
      ) : displayProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link to={`/projects/${project.id}`} className="block h-full">
                <div className="bg-white rounded-lg shadow-card p-6 hover:shadow-lg transition-shadow max-h-40 flex flex-col">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-1" title={project.name}>{project.name}</h3>
                      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        {project.conversationsCount !== null && project.conversationsCount !== undefined ?
                          project.conversationsCount === 0 ? t('projects.list.noChats') : project.conversationsCount === 1 ? t('projects.list.oneChat') : t('projects.list.chats', { count: project.conversationsCount })
                          : t('projects.list.conversations_zero')}
                      </span>
                    </div>
                    <p title={project.description} className="mt-2 text-sm text-gray-500 line-clamp-2">{project.description || t('projects.list.noDescription')}</p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto pt-4 flex justify-between items-center text-xs text-gray-500">
                    <span>{t('projects.list.updated', { date: new Date(project.updatedAt).toLocaleDateString() })}</span>
                    <span>{t('projects.list.members', { count: project.members })}</span>
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
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('projects.list.noProjectsTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {localSearchQuery
              ? t('projects.list.noSearchResults', { query: localSearchQuery })
              : t('projects.list.noProjectsMessage')}
          </p>
        </div>
      )}

      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-auto flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
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
                  {((pagination.current_page - 1) * pagination.per_page) + 1}
                </span>{' '}
                {t('pagination.to')}{' '}
                <span className="font-medium">
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                </span>{' '}
                {t('pagination.of')}{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
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
  );
};

export default ProjectsList;

