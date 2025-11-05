import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import ptTranslations from './locales/pt.json';

const resources = {
  en: {
    translation: enTranslations
  },
  pt: {
    translation: ptTranslations
  },
  'pt-BR': {
    translation: ptTranslations
  },
  'pt-PT': {
    translation: ptTranslations
  }
};

// Detect language from browser on every app load
const detectLanguage = (): string => {
  // Check localStorage first for user preference
  const savedLang = localStorage.getItem('language');
  if (savedLang && (savedLang === 'en' || savedLang.startsWith('pt'))) {
    return savedLang;
  }
  
  // Fall back to browser detection
  const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
  
  // Check if Portuguese (any variant)
  if (browserLang.startsWith('pt')) {
    return browserLang;
  }
  
  // Default to English
  return 'en';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: detectLanguage(),
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

