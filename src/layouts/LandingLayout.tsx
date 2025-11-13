import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../assets/polaris_logo_black.png';
import LanguageToggle from '../components/common/LanguageToggle';
import Button from '../components/ui/Button';

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 border-b border-gray-200 shadow-sm">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={logo} 
                alt="POLARIS" 
                className="h-12 w-auto"
              />
            </Link>

            {/* Right side - Language Toggle and Auth Buttons */}
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="md">
                    {t('landing.header.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="md">
                    {t('landing.header.register')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
};

export default LandingLayout;

