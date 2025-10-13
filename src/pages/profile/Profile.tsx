import React, { useState, useEffect } from 'react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { changePassword, updateProfile } from '../../services/authService';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const Profile: React.FC = () => {
  const { user, updateUser, isLoading } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    jobTitle: 'Product Manager',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    bio: 'Product manager with 5+ years of experience in SaaS products.',
    notifications: {
      email: true,
      browser: true,
      mobile: false,
    },
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Update form data when user data becomes available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }));
    }
  }, [user]);
  
  // Show loading state while user data is being loaded
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked,
      },
    }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (!user?.id) {
        showErrorToast('User ID not found');
        return;
      }

      const response = await updateProfile(
        user.id,
        formData.firstName,
        formData.lastName
      );
      
      showSuccessToast('Profile updated successfully!');
      
      // Update user in context and localStorage
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: `${formData.firstName} ${formData.lastName}`.trim()
      });
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update profile. Please try again.';
      showErrorToast(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setPasswordErrors({});
    
    // Validation
    let hasErrors = false;
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      hasErrors = true;
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
      hasErrors = true;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
      hasErrors = true;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // If we reach here, the request was successful (200 status)
      showSuccessToast('Password changed successfully!');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to change password. Please try again.';
      showErrorToast(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        {/* <h1 className="text-2xl font-bold text-gray-900">My Profile</h1> */}
        {!isEditing ? (
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-4xl font-semibold">
                  {formData.firstName.charAt(0).toUpperCase()}
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
              <h2 className="text-xl font-semibold text-gray-900">{`${formData.firstName} ${formData.lastName}`}</h2>
              <p className="text-gray-500">{formData.jobTitle}</p>
              <div className="mt-2 flex items-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>{formData.email}</span>
              </div>
              {/* <div className="mt-1 flex items-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span>{formData.phone}</span>
              </div>
              <div className="mt-1 flex items-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{formData.timezone}</span>
              </div> */}
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
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                      value={formData.email}
                      disabled
                    />
                  </div>
                  
                  {/* <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                      value={formData.jobTitle}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                      value={formData.phone}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                      value={formData.timezone}
                      disabled
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                      value={formData.bio}
                      disabled
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Brief description for your profile.
                    </p>
                  </div> */}
                </div>
              </form>
            </motion.div>
          ) : (
            <></>
            // <div className="mt-6">
            //   <h3 className="text-lg font-medium text-gray-900">About</h3>
            //   <p className="mt-1 text-gray-600">{formData.bio}</p>
            // </div>
          )}
        </div>
      </div>
      
      {/* Notification preferences */}
      {/* <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="email"
                  className="sr-only peer"
                  checked={formData.notifications.email}
                  onChange={handleNotificationChange}
                  disabled={!isEditing}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Browser Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications in the browser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="browser"
                  className="sr-only peer"
                  checked={formData.notifications.browser}
                  onChange={handleNotificationChange}
                  disabled={!isEditing}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Mobile Push Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications on your mobile device</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="mobile"
                  className="sr-only peer"
                  checked={formData.notifications.mobile}
                  onChange={handleNotificationChange}
                  disabled={!isEditing}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div> */}
      
      {/* Change password */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type={showCurrentPassword ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              placeholder="••••••••"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.currentPassword}
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showCurrentPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              }
              autoComplete="current-password"
            />
            
            <Input
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              placeholder="••••••••"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.newPassword}
              helperText={!passwordErrors.newPassword ? "Password must be at least 8 characters long." : undefined}
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              }
              autoComplete="new-password"
            />
            
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.confirmPassword}
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              }
              autoComplete="new-password"
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
              >
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

