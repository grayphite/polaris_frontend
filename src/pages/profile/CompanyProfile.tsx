import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';

const CompanyProfile: React.FC = () => {
  const { t } = useTranslation();
  // Form state
  const [formData, setFormData] = useState({
    name: 'Acme Corporation',
    industry: 'Technology',
    size: '50-100',
    website: 'https://www.acmecorp.com',
    description: 'Acme Corporation is a leading technology company specializing in AI-powered solutions for businesses. We help organizations leverage artificial intelligence to improve their operations and deliver better customer experiences.',
    address: {
      street: '123 Tech Park',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States',
    },
    logo: null,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Type-safe way to handle nested objects
        if (parent === 'address') {
          return {
            ...prev,
            address: {
              ...prev.address,
              [child]: value,
            },
          };
        }
        return { ...prev, [name]: value };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would make an API call to update the company profile
    console.log('Saving company profile:', formData);
    
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('companyProfile.title')}</h1>
        {!isEditing ? (
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
          >
            {t('companyProfile.editCompanyProfile')}
          </Button>
        ) : (
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              isLoading={isSaving}
            >
              {t('common.saveChanges')}
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-32 w-32 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 text-4xl font-semibold">
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{formData.name}</h2>
              <p className="text-gray-500">{formData.industry} • {t(`companyProfile.sizeOptions.${formData.size}`)}</p>
              <div className="mt-2 flex items-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {formData.website}
                </a>
              </div>
              <div className="mt-1 flex items-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>
                  {formData.address.city}, {formData.address.state}, {formData.address.country}
                </span>
              </div>
            </div>
          </div>
          
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      {t('companyProfile.companyNameLabel')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      {t('companyProfile.websiteLabel')}
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                      {t('companyProfile.industryLabel')}
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.industry}
                      onChange={handleInputChange}
                    >
                      <option value="Technology">{t('companyProfile.industryOptions.technology')}</option>
                      <option value="Finance">{t('companyProfile.industryOptions.finance')}</option>
                      <option value="Healthcare">{t('companyProfile.industryOptions.healthcare')}</option>
                      <option value="Education">{t('companyProfile.industryOptions.education')}</option>
                      <option value="Retail">{t('companyProfile.industryOptions.retail')}</option>
                      <option value="Manufacturing">{t('companyProfile.industryOptions.manufacturing')}</option>
                      <option value="Other">{t('companyProfile.industryOptions.other')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                      {t('companyProfile.companySizeLabel')}
                    </label>
                    <select
                      id="size"
                      name="size"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.size}
                      onChange={handleInputChange}
                    >
                      <option value="1-10">{t('companyProfile.sizeOptions.1-10')}</option>
                      <option value="11-50">{t('companyProfile.sizeOptions.11-50')}</option>
                      <option value="50-100">{t('companyProfile.sizeOptions.50-100')}</option>
                      <option value="101-500">{t('companyProfile.sizeOptions.101-500')}</option>
                      <option value="501-1000">{t('companyProfile.sizeOptions.501-1000')}</option>
                      <option value="1000+">{t('companyProfile.sizeOptions.1000+')}</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      {t('companyProfile.companyDescriptionLabel')}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('companyProfile.address')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                        {t('companyProfile.streetAddressLabel')}
                      </label>
                      <input
                        type="text"
                        id="address.street"
                        name="address.street"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={formData.address.street}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                        {t('companyProfile.cityLabel')}
                      </label>
                      <input
                        type="text"
                        id="address.city"
                        name="address.city"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={formData.address.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                        {t('companyProfile.stateLabel')}
                      </label>
                      <input
                        type="text"
                        id="address.state"
                        name="address.state"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={formData.address.state}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700">
                        {t('companyProfile.zipCodeLabel')}
                      </label>
                      <input
                        type="text"
                        id="address.zipCode"
                        name="address.zipCode"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={formData.address.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
                        {t('companyProfile.countryLabel')}
                      </label>
                      <input
                        type="text"
                        id="address.country"
                        name="address.country"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={formData.address.country}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">{t('companyProfile.about')}</h3>
              <p className="mt-1 text-gray-600">{formData.description}</p>
              
              <h3 className="text-lg font-medium text-gray-900 mt-6">{t('companyProfile.address')}</h3>
              <address className="mt-1 not-italic text-gray-600">
                {formData.address.street}<br />
                {formData.address.city}, {formData.address.state} {formData.address.zipCode}<br />
                {formData.address.country}
              </address>
            </div>
          )}
        </div>
      </div>
      
      {/* Subscription info - read-only */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{t('companyProfile.subscription.title')}</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.href = '/subscription'}
            >
              {t('companyProfile.subscription.manageSubscription')}
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{t('companyProfile.subscription.proPlan')}</h4>
              <p className="text-gray-600 mt-1">{t('companyProfile.subscription.monthlyPrice')}</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {t('companyProfile.subscription.active')}
            </span>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{t('companyProfile.subscription.users')}</span>
              <span className="font-medium">8 / 10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Your plan allows up to 10 users. You are currently using 8 seats.
            </p>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{t('companyProfile.subscription.projects')}</span>
              <span className="font-medium">12 / {t('companyProfile.subscription.unlimited')}</span>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{t('companyProfile.subscription.storage')}</span>
              <span className="font-medium">2.4 GB / 50 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full" style={{ width: '5%' }}></div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {t('companyProfile.subscription.renewalMessage', { date: 'November 15, 2023' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
