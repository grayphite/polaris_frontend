import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import React from 'react';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-light-200 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4">Page not found</h2>
          <p className="mt-2 text-lg text-gray-600">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/">
            <Button variant="primary" size="lg" fullWidth>
              Go to Home
            </Button>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Go back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
