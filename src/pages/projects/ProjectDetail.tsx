import { Link, useNavigate, useParams } from 'react-router-dom';
import React, { useState } from 'react';

import Button from '../../components/ui/Button';
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
  
  // Mock data for project
  const project = {
    id: projectId,
    name: 'Marketing Campaign',
    description: 'Q4 marketing strategy and content planning for the new product launch. This project includes all marketing materials, social media strategy, and PR planning.',
    createdAt: '2023-09-15T10:30:00Z',
    updatedAt: '2023-10-05T14:45:00Z',
  };
  
  // Mock data for conversations
  const conversations: Conversation[] = [
    {
      id: '1',
      title: 'Social Media Strategy',
      lastMessage: 'We should focus on Instagram and TikTok for the younger demographic.',
      updatedAt: '2023-10-05T14:45:00Z',
      messageCount: 24,
    },
    {
      id: '2',
      title: 'Email Campaign Planning',
      lastMessage: 'The sequence should have 5 emails with increasing urgency.',
      updatedAt: '2023-10-04T09:20:00Z',
      messageCount: 18,
    },
    {
      id: '3',
      title: 'Content Calendar',
      lastMessage: 'Let\'s schedule the blog posts to align with the product features reveal.',
      updatedAt: '2023-10-03T16:10:00Z',
      messageCount: 32,
    },
    {
      id: '4',
      title: 'Budget Allocation',
      lastMessage: 'We need to increase the PPC budget for the launch week.',
      updatedAt: '2023-10-02T11:30:00Z',
      messageCount: 15,
    },
  ];
  
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
    <div className="space-y-6">
      {/* Project header */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-gray-600">{project.description}</p>
            <p className="mt-2 text-sm text-gray-500">
              Created on {formatDate(project.createdAt)} • Last updated {formatDate(project.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/projects/${projectId}/chat/new`}>
              <Button
                variant="primary"
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                }
              >
                New Conversation
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-card">
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
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {/* Conversations tab */}
          {activeTab === 'conversations' && (
            <div className="space-y-6">
              {/* Conversations list remains here, toolbar moved to sidebar per new design */}
              {conversations.length > 0 ? (
                <div className="space-y-4">
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
    </div>
  );
};

export default ProjectDetail;
