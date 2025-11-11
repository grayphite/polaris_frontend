import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/polaris_logo.png';

const SubscriptionHeader: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const initial = user?.username?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Polaris" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="relative z-40" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center text-sm focus:outline-none"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-base font-medium text-white">
                {initial}
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1 h-4 w-4 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
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

export default SubscriptionHeader;


