import React from 'react';
import { useTranslation } from 'react-i18next';
import USFlag from '../../assets/US.png';
import BrazilFlag from '../../assets/brazil.png';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  
  // Check if current language is Portuguese (any variant)
  const isPortuguese = i18n.language.startsWith('pt');
  
  const toggleLanguage = () => {
    const newLang = isPortuguese ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };
  
  return (
    <div className="flex items-center gap-2">
      {/* Language Labels */}
      <span className={`text-sm font-medium transition-colors ${!isPortuguese ? 'text-gray-800' : 'text-gray-400'}`}>
        ENG
      </span>
      
      {/* Toggle Track */}
      <button
        onClick={toggleLanguage}
        className="relative w-16 h-8 rounded-full bg-gray-200 shadow-inner transition-all duration-300 focus:outline-none"
        aria-label="Toggle language"
      >
        {/* Sliding Button */}
        <div
          className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg overflow-hidden transition-transform duration-300 ${
            isPortuguese ? 'translate-x-8' : 'translate-x-0'
          }`}
        >
          <img 
            src={isPortuguese ? BrazilFlag : USFlag} 
            alt={isPortuguese ? 'Brazil flag' : 'UK flag'}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Failed to load flag:', (e.target as HTMLImageElement).src);
            }}
          />
        </div>
      </button>
      
      {/* Language Labels */}
      <span className={`text-sm font-medium transition-colors ${isPortuguese ? 'text-gray-800' : 'text-gray-400'}`}>
        POR
      </span>
    </div>
  );
};

export default LanguageToggle;

