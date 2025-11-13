import React from 'react';
import { useTranslation } from 'react-i18next';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 lg:py-32 overflow-hidden">
      {/* Floating animated shapes */}
      <div className="hidden lg:block absolute top-20 left-20 w-16 h-16 bg-secondary-200/30 rounded-2xl float-animation pointer-events-none z-0" style={{ animationDelay: '0s' }}></div>
      <div className="hidden lg:block absolute top-40 right-20 w-12 h-12 bg-primary-200/30 rounded-xl float-animation pointer-events-none z-0" style={{ animationDelay: '2s' }}></div>
      <div className="hidden lg:block absolute bottom-40 left-40 w-20 h-20 bg-primary-300/30 rounded-3xl float-animation pointer-events-none z-0" style={{ animationDelay: '4s' }}></div>
      <div className="hidden lg:block absolute bottom-20 right-10 w-14 h-14 bg-secondary-300/30 rounded-2xl float-animation pointer-events-none z-0" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-primary-600">
              {t('landing.hero.headlinePart1')}
            </span>
            {t('landing.hero.headlinePart2') && (
              <span className="text-gray-900">
                {' '}{t('landing.hero.headlinePart2')}
              </span>
            )}
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('landing.hero.description')}
          </p>

          {/* Value Proposition Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('landing.hero.badge1')}
            </div>
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('landing.hero.badge2')}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium">{t('landing.hero.feature1')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-medium">{t('landing.hero.feature2')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{t('landing.hero.feature3')}</span>
            </div>
          </div>

          {/* GIF Placeholder for Animation */}
          {/* <div className="mt-16 flex justify-center">
            <div className="w-full max-w-4xl h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <p className="text-gray-400 text-sm">
                {t('landing.hero.animationPlaceholder')}
              </p>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

