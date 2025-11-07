import { Link, useOutletContext } from 'react-router-dom';
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  isPositive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, isPositive }) => {
  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{change}
              </span>
              <svg
                className={`h-4 w-4 ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isPositive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
                />
              </svg>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-light-300 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
};

interface RecentProjectProps {
  name: string;
  description: string;
  lastUpdated: string;
  conversations: number;
  id: string;
}

const RecentProject: React.FC<RecentProjectProps> = ({ name, description, lastUpdated, conversations, id }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/projects/${id}`} className="block">
      <div className="bg-white rounded-lg shadow-card p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className="bg-light-300 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-gray-500">{t('dashboard.lastUpdated', { date: lastUpdated })}</span>
          <span className="text-xs bg-light-300 px-2 py-1 rounded-full">
            {t('dashboard.conversations', { count: conversations })}
          </span>
        </div>
      </div>
    </Link>
  );
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openCreateProject } = useOutletContext<{ openCreateProject: () => void }>();
  
  // Mock data for dashboard
  const stats = [
    {
      title: t('dashboard.totalProjects'),
      value: 12,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      change: '10%',
      isPositive: true,
    },
    {
      title: t('dashboard.activeConversations'),
      value: 28,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      ),
      change: '25%',
      isPositive: true,
    },
    {
      title: t('dashboard.teamMembers'),
      value: 8,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      ),
    },
    {
      title: t('dashboard.subscription'),
      value: t('dashboard.proPlan'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];
  
  const recentProjects = [
    {
      id: '1',
      name: 'Marketing Campaign',
      description: 'Q4 marketing strategy and content planning',
      lastUpdated: '2 hours ago',
      conversations: 8,
    },
    {
      id: '2',
      name: 'Product Roadmap',
      description: 'Feature planning and prioritization for next quarter',
      lastUpdated: '1 day ago',
      conversations: 12,
    },
    {
      id: '3',
      name: 'Customer Research',
      description: 'Analysis of customer feedback and market trends',
      lastUpdated: '3 days ago',
      conversations: 5,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.username ? t('dashboard.welcome', { username: user.username }) : t('dashboard.welcomeDefault')}
        </h1>
        <p className="mt-1 text-gray-600">{t('dashboard.subtitle')}</p>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>
      
      {/* Recent projects */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.recentProjects')}</h2>
          <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            {t('dashboard.viewAll')}
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <RecentProject {...project} />
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button onClick={openCreateProject} className="text-left">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-light-300 transition-colors flex items-center w-full">
              <div className="p-2 bg-primary-100 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium">{t('dashboard.newProject')}</span>
            </div>
          </button>
          
          {/* All quick actions accessible to all users */}
          <Link to="/members">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-light-300 transition-colors flex items-center">
              <div className="p-2 bg-secondary-100 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </div>
              <span className="text-sm font-medium">{t('dashboard.inviteTeamMember')}</span>
            </div>
          </Link>
          
          <Link to="/subscription">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-light-300 transition-colors flex items-center">
              <div className="p-2 bg-purple-100 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium">{t('dashboard.manageSubscription')}</span>
            </div>
          </Link>
          
          <Link to="/profile">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-light-300 transition-colors flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium">{t('dashboard.editProfile')}</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

