import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  user: any;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  user,
  onLogout,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="bg-white shadow-sm z-10 flex-shrink-0">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center min-w-0 gap-3">
          <button
            onClick={onToggleSidebar}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
            aria-label={t('header.toggleSidebar')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="ml-1 sm:ml-2 text-base sm:text-lg font-medium truncate">
            {location.pathname === '/projects' ? t('header.projects') : location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1)}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <div className="relative flex-shrink-0" ref={userMenuRef}>
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
                {t('header.yourProfile')}
              </NavLink>
              
              {/* All menu items accessible to all users */}
              <NavLink
                to="/members"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setUserMenuOpen(false)}
              >
                {t('header.manageTeam')}
              </NavLink>
              {/* <NavLink
                to="/company-profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setUserMenuOpen(false)}
              >
                Company Profile
              </NavLink> */}
              {user?.role === 'owner' && <NavLink
                to="/subscription-details"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setUserMenuOpen(false)}
              >
                Subscription
              </NavLink>}
              
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {t('header.signOut')}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

