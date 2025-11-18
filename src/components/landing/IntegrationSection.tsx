import React from 'react';
import { useTranslation } from 'react-i18next';

const IntegrationSection: React.FC = () => {
  const { t } = useTranslation();

  const integrations = [
    {
      title: t('landing.integration.feature1.title'),
      description: t('landing.integration.feature1.description'),
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: t('landing.integration.feature2.title'),
      description: t('landing.integration.feature2.description'),
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      title: t('landing.integration.feature3.title'),
      description: t('landing.integration.feature3.description'),
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('landing.integration.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.integration.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {integrations.map((integration, index) => (
            <div key={index} className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-lg shadow-card p-6 h-full text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                  {integration.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {integration.title}
              </h3>
              <p className="text-gray-600">
                {integration.description}
              </p>
            </div>
          ))}
        </div>

        {/* GIF Placeholder for Integration Demo */}
        {/* <div className="flex justify-center">
          <div className="w-full max-w-4xl h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <p className="text-gray-400 text-sm">
              {t('landing.integration.animationPlaceholder')}
            </p>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default IntegrationSection;

