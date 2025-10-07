import React, { useState } from 'react';

import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  conversationsCount: number;
  members: number;
  tags: string[];
}

const ProjectsList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Mock data for projects
  const projects: Project[] = [
    {
      id: '1',
      name: 'Marketing Campaign',
      description: 'Q4 marketing strategy and content planning',
      createdAt: '2023-09-15',
      updatedAt: '2023-10-05',
      conversationsCount: 8,
      members: 4,
      tags: ['marketing', 'content'],
    },
    {
      id: '2',
      name: 'Product Roadmap',
      description: 'Feature planning and prioritization for next quarter',
      createdAt: '2023-08-20',
      updatedAt: '2023-10-03',
      conversationsCount: 12,
      members: 6,
      tags: ['product', 'planning'],
    },
    {
      id: '3',
      name: 'Customer Research',
      description: 'Analysis of customer feedback and market trends',
      createdAt: '2023-09-01',
      updatedAt: '2023-09-28',
      conversationsCount: 5,
      members: 3,
      tags: ['research', 'customers'],
    },
    {
      id: '4',
      name: 'Website Redesign',
      description: 'Redesigning company website for better UX and conversion',
      createdAt: '2023-07-10',
      updatedAt: '2023-09-20',
      conversationsCount: 15,
      members: 5,
      tags: ['design', 'website'],
    },
    {
      id: '5',
      name: 'Sales Strategy',
      description: 'Developing new sales approach for enterprise clients',
      createdAt: '2023-09-10',
      updatedAt: '2023-10-01',
      conversationsCount: 7,
      members: 4,
      tags: ['sales', 'strategy'],
    },
    {
      id: '6',
      name: 'Mobile App Development',
      description: 'Building companion mobile app for our main product',
      createdAt: '2023-08-05',
      updatedAt: '2023-09-25',
      conversationsCount: 20,
      members: 8,
      tags: ['development', 'mobile'],
    },
  ];
  
  // Filter projects based on search query and filter
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(project.updatedAt) >= oneWeekAgo;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link to="/projects/new">
          <Button
            variant="primary"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            New Project
          </Button>
        </Link>
      </div>
      
      {/* Search and filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex-shrink-0">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              <option value="recent">Recently Updated</option>
              <option value="mine">My Projects</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Projects grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link to={`/projects/${project.id}`} className="block h-full">
                <div className="bg-white rounded-lg shadow-card p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                      <span className="bg-light-300 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {project.conversationsCount} conversations
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{project.description}</p>
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
                    <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    <span>{project.members} members</span>
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? `No projects match "${searchQuery}"`
              : "You haven't created any projects yet."}
          </p>
          <div className="mt-6">
            <Link to="/projects/new">
              <Button
                variant="primary"
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                }
              >
                New Project
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
