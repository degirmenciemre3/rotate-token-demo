import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <div className="text-2xl font-semibold text-gray-600 mt-4">
            {t('errors.notFound')}
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-500 max-w-md mx-auto">
            {t('common.loading')}
          </p>
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← {t('common.cancel')}
            </button>
            
            <Link 
              to="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('navigation.dashboard')}
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <Link to="/documentation" className="hover:text-gray-600 transition-colors">
            {t('navigation.documentation')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
