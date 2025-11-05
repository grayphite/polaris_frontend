import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-light-200 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">{t('notFound.title')}</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4">{t('notFound.heading')}</h2>
          <p className="mt-2 text-lg text-gray-600">
            {t('notFound.message')}
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/projects">
            <Button variant="primary" size="lg" fullWidth>
              {t('notFound.goToProjects')}
            </Button>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            {t('notFound.goBack')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

